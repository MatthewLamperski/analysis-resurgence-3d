import json
from json import JSONEncoder
import os
import math
from operator import itemgetter
import numpy as np


# self.config = {
#     'bin_size': 60000,
#     'bin_num_phase_1': 5,
#     'bin_num_phase_2_max': 5,
#     'bin_num_phase_3': 5,
# }


# Our participant class. Each participant corresponds to one .csv file
# which is stored in the 'filepath' variable. On init, python will analyze
# the participant's file and store all necessary info in the Participant class.
class Participant:
    def __init__(self, dir_path, file_path, config):
        self.dir_path = dir_path
        self.file_path = file_path
        self.error = None
        self.config = config

        # Instantiate variables

        # These will be initialized by extract_event_markers()
        self.no_phase_1 = None
        self.num_of_events = None
        self.events = None

        # These will be initialized (or set) by analyze_event_markers
        self.phase_3_latency = [-1000, -1000, -1000, -1000]  # Initialize with -1000ms latency for each phase
        self.phases_offset = (0, 0, 0)

        # We found that event markers 30 and 31 (end of phases 1 and 2) were not present in all participant files
        # So, if that is found to be the case, then this script will tell the GUI this, and a manual override
        # will be allowed. In that case, the phase durations will be manually set.
        if 'phases_duration' in self.config:
            self.phases_duration = self.config['phases_duration']
        else:
            self.phases_duration = [0, 0, 0]

        self.bin_phase_2 = None

        self.excluded = False
        self.exclusion_reason = ''
        self.sr = []

        self.event_list = []
        self.event_99_detected = False

        # File analysis

        # First, we want to extract all the event markers from the file,
        # The rest of analysis will only depend on these events.
        self.__extract_event_markers()

        # Next, we want to analyze all the events to generate the
        # summary that will be used to create new csv file
        self.__analyze_event_markers()

    # Private function to be used during initialization
    def __extract_event_markers(self):
        # TODO: Check on Windows to see if this properly escapes ANY filepath
        file = open(os.path.join(self.dir_path, self.file_path), "r")

        # Reads first 6 bytes (in this case letters/nums)
        # If line doesn't begin with 'Start:', ignore rest of initialization
        if file.readline(6) != "Start:":
            self.error = f"File {self.file_path} does not begin with 'Start:'"
        else:
            current_line = file.readline()

            # Skip all lines that don't start with 'LIST OF EVENTS'. We have now reached the beginning of the event list.
            # We need to dynamically find the END of this list - which is marked by a blank line.
            while not current_line.startswith("LIST OF EVENTS"):
                current_line = file.readline()

                if current_line.startswith("noPhase1:"):
                    # Checks if participant went through phase 1.
                    # 0 or 1 value here is converted to a boolean for clarity
                    self.no_phase_1 = bool(int(current_line.rstrip().split()[1]))

                if current_line.startswith("totalSR:"):
                    self.sr.append(current_line.rstrip())
                if current_line.startswith("srPhase1:"):
                    self.sr.append(current_line.rstrip())
                if current_line.startswith("srPhase2:"):
                    self.sr.append(current_line.rstrip())
                if current_line.startswith("srPhase3:"):
                    self.sr.append(current_line.rstrip())

            current_line = file.readline()  # go to the first event
            # At this point, the file reader is at the list of events, so we need to keep reading until blank line
            while not current_line == "\n":
                self.event_list.append(current_line.rstrip().split(": "))

                current_line = file.readline()

            self.type_response = np.zeros((max(map(lambda event: int(event[0]), self.event_list)), 3, 30))
            # self.type_response = np.zeros((16, 3, 30))  # (response types, phases, max bins)
            # Now the readlines (which starts at current iterator position)
            # will give us beginning of events

            # Below line will take care of:
            #   - Filtering out lines with only a newline
            #   - Filtering out empty lines ('')
            #   - Splitting event and time into tuple
            #   - Deleting ')' from each event type ('02)' turns into '02')

            event_lines = [tuple([event_line.rstrip().split()[0][:-1], int(event_line.rstrip().split()[1])]) for
                           event_line
                           in file.readlines() if (event_line != '\n' and event_line != '')]
            self.events = event_lines
            self.num_of_events = len(event_lines)

    # Private function to be used during initialization
    def __analyze_event_markers(self):
        current_phase = 1 if self.no_phase_1 else 0  # If no_phase_1 -> start with phase 2, else start w/ 1
        current_phase_start_time = 0
        first_sr = True if self.no_phase_1 else False

        # Grabs the end times of each phase (this relies on there only being one entry starting
        # with '30)', '31)', and '99)', unless a manual duration override is supplied.
        if 'phases_duration' in self.config:
            self.phases_offset = (
                self.phases_duration[0],  # End of phase 1
                self.phases_duration[0] + self.phases_duration[1],  # End of phase 2
                sum(self.phases_duration)  # End of phase 3
            )
        else:
            # next() accepts a default, so if '99' is not found, then it will be the max time
            self.phases_offset = (
                next((time for (event_type, time) in self.events if (event_type == "30")), -1),
                next((time for (event_type, time) in self.events if (event_type == "31")), -1),
                next((time for (event_type, time) in self.events if (event_type == "99")),
                     max(self.events, key=lambda event: event[1])[1])
            )

        if self.phases_offset[0] == -1 or self.phases_offset[1] == -1:
            raise Exception(1)

        for event_marker in self.events:
            event_type, event_time = event_marker
            time_till_phase_end = self.phases_offset[current_phase] - event_time
            time_since_phase_begin = event_time - current_phase_start_time

            if event_type == "17" or event_type == "18":  # First SR -> Starts phase1 (skipped for noPhase1)
                if not first_sr:
                    first_sr = True
                    # current_phase += 1  # Commenting out -> we started out in phase 1 (current_phase = 0)
                    current_phase_start_time = event_time
                    self.__assign_forward(0, current_phase, 0)

            if event_type == "30":  # End of phase 1
                self.phases_duration[0] = event_time - current_phase_start_time
                current_phase += 1
                current_phase_start_time = event_time

            elif event_type == "31":  # End of phase 2
                # Calculate #bins in Phase 2 first
                self.bin_phase_2 = math.floor((event_time - current_phase_start_time) / self.config['bin_size'])

                self.phases_duration[1] = event_time - current_phase_start_time
                current_phase += 1
                current_phase_start_time = event_time

            elif event_type == "99":  # End of phase 3
                self.phases_duration[2] = event_time - current_phase_start_time
                self.event_99_detected = True

            elif event_type == "01":  # Target response
                if current_phase == 0 or current_phase == 1:
                    if first_sr:
                        self.__assign_backward(int(event_type) - 1, current_phase, time_till_phase_end)
                elif current_phase == 2:
                    if first_sr:
                        self.__assign_forward(int(event_type) - 1, current_phase, time_since_phase_begin)
                    if self.phase_3_latency[0] == -1000:
                        self.phase_3_latency[0] = time_since_phase_begin

            elif event_type == "02":  # Alt response
                if current_phase == 0 or current_phase == 1:
                    if first_sr:
                        self.__assign_backward(int(event_type) - 1, current_phase, time_till_phase_end)
                elif current_phase == 2:
                    if first_sr:
                        self.__assign_forward(int(event_type) - 1, current_phase, time_since_phase_begin)
                    if self.phase_3_latency[1] == -1000:
                        self.phase_3_latency[1] = time_since_phase_begin

            else:  # All other response types
                if current_phase == 0 or current_phase == 1:
                    if first_sr:
                        self.__assign_backward(int(event_type) - 1, current_phase, time_till_phase_end)
                elif current_phase == 2:
                    if first_sr:
                        self.__assign_forward(int(event_type) - 1, current_phase, time_since_phase_begin)

        # Check if phase3 duration was recorded
        if self.phases_duration[2] == 0:
            # if not initialized -> set it in accordance of max time
            self.phases_duration[2] = self.phases_offset[2] - current_phase_start_time

        # Check exclusion reasons

        # 3. There are zero target AND zero alt responses in the last five bins of Phase 1
        num_bins_p1 = self.config['bin_num_phase_1']
        last_5_bins_of_phase_1_tr = list(
            map(lambda num: int(num), self.type_response[0][0][(num_bins_p1 - 5):(num_bins_p1 - 30)]))
        last_5_bins_of_phase_1_ar = list(
            map(lambda num: int(num), self.type_response[1][0][(num_bins_p1 - 5):(num_bins_p1 - 30)]))
        if sum(last_5_bins_of_phase_1_tr) == 0 and sum(last_5_bins_of_phase_1_ar) == 0:
            self.excluded = True
            self.exclusion_reason = "Zero target and zero alt responses in last 5 bins of Phase 1"

        # 4. There are zero target AND zero alt responses in the last five bins of Phase 2
        num_bins_p2 = self.config['bin_num_phase_2_max']
        last_5_bins_of_phase_2_tr = list(
            map(lambda num: int(num), self.type_response[0][1][(num_bins_p2 - 5):(num_bins_p2 - 30)]))
        last_5_bins_of_phase_2_ar = list(
            map(lambda num: int(num), self.type_response[1][1][(num_bins_p2 - 5):(num_bins_p2 - 30)]))

        if sum(last_5_bins_of_phase_2_tr) == 0 and sum(last_5_bins_of_phase_2_ar) == 0:
            self.excluded = True
            self.exclusion_reason = "Zero target and zero alt responses in the last 5 bins of Phase 2"

        # 5. There are no alt responses in all of Phase 2
        alt_responses_in_phase_2 = list(map(lambda nums: list(map(lambda num: int(num), nums)), self.type_response[1]))
        alt_responses_in_phase_2 = np.asarray(alt_responses_in_phase_2).flatten()
        if sum(alt_responses_in_phase_2) == 0:
            self.excluded = True
            self.exclusion_reason = "There are no alt responses in all of Phase 2"

        # 6. By the end of Phase 2, target responding has not decreased to 50% of the Phase-1 levels.
        # Take average # of target responses in last 5 bins of phase 1
        avg_tg_responses_p1 = sum(last_5_bins_of_phase_1_tr) / 5.0
        # print(f"{self.file_path[:-4]} avg p1 last 5 bins", avg_tg_responses_p1)
        # Get # of target responses in last bin of phase 2
        tg_responses_p2_last_bin = last_5_bins_of_phase_2_tr[-1]
        # If responding has not decreased to below 50% of phase 1 avg, exclude it
        if tg_responses_p2_last_bin >= (0.5 * avg_tg_responses_p1):
            self.excluded = True
            self.exclusion_reason = f"Target responding did not decrease below 50% of phase 1 levels.\nPhase 1 AVG: {avg_tg_responses_p1}. Last bin of Phase 2: {tg_responses_p2_last_bin}"

        # If 99 was not detected, (some csvs were cut off in earlier experiments)
        # then do NOT exclude, instead give exclusion reason to be 'cut-off', so that when producing summary,
        # the engine will detect not to give analysis, and instead only give summary data found at top of page
        if not self.event_99_detected:
            self.excluded = False
            self.exclusion_reason = "Cut-Off"

    # Helper Functions (named bin as _bin b/c python uses that name elsewhere - just to be safe)
    def __assign_backward(self, event_type, phase, time_till_phase_end):
        _bin, bin_size = 0, self.config['bin_size']
        bin_num_phase_1, bin_num_phase_2_max = itemgetter('bin_num_phase_1', 'bin_num_phase_2_max')(self.config)
        if phase == 0:
            _bin = bin_num_phase_1 - math.floor(time_till_phase_end / bin_size)  # Round down first
        elif phase == 1:
            _bin = bin_num_phase_2_max - math.floor(time_till_phase_end / bin_size)  # Round down first

        if _bin > 0:
            current_bin_count = self.type_response[event_type][phase][_bin - 1]
            if (current_bin_count < 300):
                self.type_response[event_type][phase][_bin - 1] += 1
            else:
                self.type_response[event_type][phase][_bin - 1] += 1
                self.excluded = True
                self.exclusion_reason = f"Too many responses in bin {_bin} in phase {phase + 1} for event {event_type + 1} ({int(current_bin_count + 1)})"

    def __assign_forward(self, event_type, phase, time_since_phase_begin):
        # Same issue with time_since_phase_begin, may be incorrectly named, but program should
        # work the same - OG var name was again 'time'
        bin_size = self.config['bin_size']
        _bin = math.floor(time_since_phase_begin / bin_size) + 1  # Round down first, then +1 (same as round up)
        current_bin_count = self.type_response[event_type][phase][_bin - 1]
        if (current_bin_count < 300):
            self.type_response[event_type][phase][_bin - 1] += 1
        else:
            self.type_response[event_type][phase][_bin - 1] += 1
            self.excluded = True
            self.exclusion_reason = f"Too many responses in bin {_bin + 1} in phase {phase + 1} for event {event_type + 1} ({int(current_bin_count + 1)})"


# Our custom encoder, which allows each participant object to be
# JSON serializable. AKA if we ever want to send participant info to
# the JavaScript GUI, we can send it JSON formatted, so it can
# understand it.
class ParticipantEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, np.ndarray):
            return o.tolist()
        else:
            return o.__dict__
