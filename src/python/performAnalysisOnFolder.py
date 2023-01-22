import sys, json, os, time
from engine import AnalysisEngine
from participant import Participant, ParticipantEncoder

# This program is to be run within the context of the GUI provided
# If this program runs on its own, it will (likely) fail as it depends
# on information provided to it by the GUI.
if __name__ == '__main__':
    # Get directory path from Electron (submitted by the user as arguments to cmd line)
    n = len(sys.argv)
    if n < 2:
        response = {
            "error": "Script run with 0 arguments, path to folder needs to be passed."
        }
        json.dump(response, sys.stdout)
    else:
        try:
            # All this information is received from Electron
            dir_path = str(sys.argv[1])
            analysis_type = str(sys.argv[2])
            config = json.loads(sys.argv[3])

            participant_files = os.listdir(dir_path)

            # Get time taken
            start = time.time()
            engine = AnalysisEngine(dir_path, config)
            engine.produce_summary(analysis_type)
            end = time.time() - start

            response = {
                "error": None,
                "message": "Done",
                "files_processed": engine.files_processed,
                "duration": round(end, 4),
                "out_file": engine.out_path,
                "excluded": int(len(engine.excluded_participants))
            }

            json.dump(response, sys.stdout)
            sys.stdout.flush()
        except Exception as err:
            response = {
                "error": err
            }
            print(response)
