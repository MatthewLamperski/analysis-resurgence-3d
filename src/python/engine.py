import os, json, csv, math
import numpy as np
from participant import Participant

latency_events = {
    1: "Target Response",
    2: "Alt Response",
}


class AnalysisEngine:
    def __init__(self, dir_path, config):
        self.dir_path = dir_path
        unsorted_paths = os.listdir(dir_path)
        unsorted_paths = list(filter(lambda file_path: (
                (os.path.isfile(os.path.join(dir_path, file_path))) and (os.path.splitext(file_path)[1] == ".csv")),
                                     unsorted_paths))
        self.participant_files = sorted(unsorted_paths, key=lambda path: path.lower())
        # Instantiates all files (not dirs) as participants
        self.config = {**config, 'bin_size': config['bin_size'] * 1000}
        self.event_list = []

        participants = [Participant(dir_path, file_path, self.config) for file_path in self.participant_files]

        # Filter out excluded participants
        if (self.config['auto_exclude']):
            self.participants = list(filter(lambda participant: not participant.excluded, participants))
        else:
            self.participants = participants

        self.excluded_participants = list(filter(lambda participant: participant.excluded, participants))

        self.event_list = self.participants[0].event_list
        self.files_processed = len(self.participants)
        self.out_path = None

    # Will produce an output file with a summary of all the participants.
    # If no filename is given, will default to 'Participantx - Participanty'
    # Can only accept 0 or 1 arguments, the one being whatever file name you want to give it
    def produce_summary(self, analysis_type, file_name=None):

        # Arg 0 will be analysis_type, Arg 1 (optional) will be out_file_name if set
        analysis_type = analysis_type

        if file_name is not None:
            out_file_name = file_name
        else:
            first_file_name = self.participant_files[0][:-4]
            last_file_name = self.participant_files[len(self.participant_files) - 1][:-4]
            out_file_name = f"{first_file_name}-{last_file_name}"

        if analysis_type == 'targetAltControl':
            self.__produce_target_alt_control_summary(out_file_name)
            if len(self.excluded_participants) != 0 and self.config['auto_exclude']:
                self.__produce_exclusion_summary(out_file_name)

    def __produce_target_alt_control_summary(self, out_file_name):

        out_path = os.path.join(self.dir_path, "out", "target_alt", f"{out_file_name}.csv")
        self.out_path = out_path

        if not os.path.exists(os.path.dirname(out_path)):
            try:
                os.makedirs(os.path.dirname(out_path),
                            exist_ok=True)  # Created dir if not exists, WILL overwrite previous
            except OSError:  # Guard against very unlikely race condition
                pass

        with open(out_path, "w+") as out_file:
            writer = csv.writer(out_file)

            # Write each row
            writer.writerow(map(lambda part: part.file_path[:-4], self.participants))

            writer.writerow([])
            # Write SR info
            for i in range(4):
                writer.writerow(map(lambda part: part.sr[i], self.participants))
            writer.writerow([])

            # Inform if has been cut off, if so, the rest of analysis should essentially be ignored, as it will be inaccurate
            writer.writerow(
                map(lambda _: "Cut-off?",
                    self.participants))

            writer.writerow(
                map(lambda part: part.exclusion_reason == "Cut-Off",
                    self.participants))

            # Write events
            for key, event_type in self.event_list:
                key = int(key)

                do_not_print = self.config.get('do_not_print')
                if do_not_print:
                    if key in do_not_print:
                        continue

                writer.writerow([])

                # If no responses were recorded for this event, then we can just write "No responses"
                all_responses_for_this_event = list(map(lambda part: part.type_response[key - 1], self.participants))
                all_responses_for_this_event = np.asarray(all_responses_for_this_event).flatten()
                # print(list(all_responses_for_this_event))
                all_zeros = not np.any(all_responses_for_this_event)
                if all_zeros:
                    writer.writerow([f"No responses were recorded for type {event_type}"])
                    continue
                else:
                    # Write event name
                    writer.writerow(map(lambda _: event_type, self.participants))

                for phase in [0, 1, 2]:
                    # Write phase number
                    writer.writerow(map(lambda _: f"Phase {phase + 1}", self.participants))

                    begin = 0
                    bin_upto = 0
                    if phase == 0:
                        begin = 0
                        bin_upto = self.config["bin_num_phase_1"]
                    elif phase == 1:
                        # If you want to cut off first X bins in phase 2 when x varies, change 'begin' below
                        # but remember, the type_response list is 0-indexed, so if you want to cut off first 4 bins,
                        # set begin to be 4.
                        begin = 0
                        bin_upto = self.config["bin_num_phase_2_max"]
                    elif phase == 2:
                        begin = 0
                        bin_upto = self.config["bin_num_phase_3"]

                    for _bin in range(begin, bin_upto):
                        # We want to get the number of responses of current type (key), in the current phase (phase) in the current bin (_bin)
                        writer.writerow(map(lambda part: part.type_response[key - 1][phase][_bin], self.participants))

            writer.writerow([])
            # Write phase durations
            writer.writerow(map(lambda _: "Phase Durations", self.participants))

            for phase in [0, 1, 2]:
                writer.writerow(map(lambda _: f"Phase {phase + 1}", self.participants))
                writer.writerow(
                    map(lambda part: str(round((int(part.phases_duration[phase]) / 1000.0), 2)), self.participants))

            # Write 'OK' if '99)' was detected, 'Miss' if not
            writer.writerow(map(lambda _: "99)", self.participants))
            writer.writerow(map(lambda partic: "OK" if partic.event_99_detected else "Miss", self.participants))

            # Empty Line
            writer.writerow([])

            # Write Latencies
            writer.writerow(map(lambda _: "Latencies", self.participants))
            for evt_type in latency_events.keys():  # 1 and 2
                writer.writerow(map(lambda _: latency_events[evt_type], self.participants))
                writer.writerow(
                    map(lambda part: str(round((int(part.phase_3_latency[evt_type - 1]) / 1000.0), 2)) if
                    part.phase_3_latency[evt_type - 1] != -1000 else "None",
                        self.participants))
                # Empty Line
                writer.writerow([])

            countTarget, countControl1, countControl2, allInvalid = 0, 0, 0, 0

            for part in self.participants:
                tar = part.phase_3_latency[0]  # Target
                con1 = part.phase_3_latency[2]  # Control 1
                con2 = part.phase_3_latency[3]  # Control 2

                tmp1 = min(tar, con1)
                if tmp1 == -1000:
                    tmp1 = max(tar, con1)

                tmp2 = min(tar, con2)
                if tmp2 == -1000:
                    tmp2 = max(tar, con2)

                fin = min(tmp1, tmp2)
                if fin == -1000:
                    fin = max(tmp1, tmp2)

                if fin == -1000:
                    allInvalid += 1
                elif fin == tar:
                    countTarget += 1
                elif fin == con1:
                    countControl1 += 1
                elif fin == con2:
                    countControl2 += 1

            writer.writerow([f"Counts of {len(self.participants)} participant(s) in Phase 3"])
            writer.writerow(["Target"])
            writer.writerow([countTarget])

            writer.writerow([])

            writer.writerow(["No target response in Phase 3"])
            writer.writerow([allInvalid])

            writer.writerow([])

            writer.writerow(["Proportion in Phase 3"])
            writer.writerow(["Target"])
            writer.writerow([str(round(float(float(countTarget) / len(self.participants)), 2))])

    def __produce_exclusion_summary(self, out_file_name):
        out_path = os.path.join(self.dir_path, "out", "target_alt", "excluded", f"{out_file_name}_excluded.csv")
        if not os.path.exists(os.path.dirname(out_path)):
            try:
                os.makedirs(os.path.dirname(out_path),
                            exist_ok=True)  # Created dir if not exists, WILL overwrite previous
            except OSError:  # Guard against very unlikely race condition
                pass

        with open(out_path, "w+") as out_file:
            writer = csv.writer(out_file)

            # Write each row
            writer.writerow(map(lambda part: part.file_path[:-4], self.excluded_participants))

            writer.writerow(map(lambda part: part.exclusion_reason, self.excluded_participants))

            # Write events
            for key, event_type in self.event_list:
                key = int(key)

                do_not_print = self.config.get('do_not_print')
                if do_not_print:
                    if key in do_not_print:
                        continue

                writer.writerow([])

                # If no responses were recorded for this event, then we can just write "No responses"
                all_responses_for_this_event = list(
                    map(lambda part: part.type_response[key - 1], self.excluded_participants))
                all_responses_for_this_event = np.asarray(all_responses_for_this_event).flatten()
                # print(list(all_responses_for_this_event))
                all_zeros = not np.any(all_responses_for_this_event)
                if all_zeros:
                    writer.writerow([f"No responses were recorded for type {event_type}"])
                    continue
                else:
                    # Write event name
                    writer.writerow(map(lambda _: event_type, self.excluded_participants))

                for phase in [0, 1, 2]:
                    # Write phase number
                    writer.writerow(map(lambda _: f"Phase {phase + 1}", self.excluded_participants))

                    begin = 0
                    bin_upto = 0
                    if phase == 0:
                        begin = 0
                        bin_upto = self.config["bin_num_phase_1"]
                    elif phase == 1:
                        # If you want to cut off first X bins in phase 2 when x varies, change 'begin' below
                        # but remember, the type_response list is 0-indexed, so if you want to cut off first 4 bins,
                        # set begin to be 4.
                        begin = 0
                        bin_upto = self.config["bin_num_phase_2_max"]
                    elif phase == 2:
                        begin = 0
                        bin_upto = self.config["bin_num_phase_3"]

                    for _bin in range(begin, bin_upto):
                        # We want to get the number of responses of current type (key), in the current phase (phase) in the current bin (_bin)
                        writer.writerow(
                            map(lambda part: part.type_response[key - 1][phase][_bin], self.excluded_participants))

            writer.writerow([])
            # Write phase durations
            writer.writerow(map(lambda _: "Phase Durations", self.excluded_participants))

            for phase in [0, 1, 2]:
                writer.writerow(map(lambda _: f"Phase {phase + 1}", self.excluded_participants))
                writer.writerow(
                    map(lambda part: str(round((int(part.phases_duration[phase]) / 1000.0), 2)),
                        self.excluded_participants))

            # Write 'OK' if '99)' was detected, 'Miss' if not
            writer.writerow(map(lambda _: "99)", self.excluded_participants))
            writer.writerow(
                map(lambda partic: "OK" if partic.event_99_detected else "Miss", self.excluded_participants))

            # Empty Line
            writer.writerow([])

            # Write Latencies
            writer.writerow(map(lambda _: "Latencies", self.excluded_participants))
            for evt_type in latency_events.keys():  # 1 and 2
                writer.writerow(map(lambda _: latency_events[evt_type], self.excluded_participants))
                writer.writerow(
                    map(lambda part: str(round((int(part.phase_3_latency[evt_type - 1]) / 1000.0), 2)) if
                    part.phase_3_latency[evt_type - 1] != -1000 else "None",
                        self.excluded_participants))
                # Empty Line
                writer.writerow([])

            countTarget, countControl1, countControl2, allInvalid = 0, 0, 0, 0

            for part in self.excluded_participants:
                tar = part.phase_3_latency[0]  # Target
                con1 = part.phase_3_latency[2]  # Control 1
                con2 = part.phase_3_latency[3]  # Control 2

                tmp1 = min(tar, con1)
                if tmp1 == -1000:
                    tmp1 = max(tar, con1)

                tmp2 = min(tar, con2)
                if tmp2 == -1000:
                    tmp2 = max(tar, con2)

                fin = min(tmp1, tmp2)
                if fin == -1000:
                    fin = max(tmp1, tmp2)

                if fin == -1000:
                    allInvalid += 1
                elif fin == tar:
                    countTarget += 1
                elif fin == con1:
                    countControl1 += 1
                elif fin == con2:
                    countControl2 += 1

            writer.writerow([f"Counts of {len(self.excluded_participants)} participant(s) in Phase 3"])
            writer.writerow(["Target"])
            writer.writerow([countTarget])

            writer.writerow([])

            writer.writerow(["No target response in Phase 3"])
            writer.writerow([allInvalid])

            writer.writerow([])

            writer.writerow(["Proportion in Phase 3"])
            writer.writerow(["Target"])
            writer.writerow([str(round(float(float(countTarget) / len(self.excluded_participants)), 2))])
