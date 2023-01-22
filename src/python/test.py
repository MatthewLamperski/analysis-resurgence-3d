import json
import os
from participant import Participant, ParticipantEncoder
from engine import AnalysisEngine


def main():
    dir_path = "/Users/matthewlamperski/Desktop/-1000 (7-8)"
    participant_files = os.listdir(dir_path)
    participants = []
    # participant1 = Participant(dir_path, participant_files[0])

    engine = AnalysisEngine(dir_path)
    engine.produce_summary()

    # for file_path in participant_files:
    #     participants.append(Participant(dir_path, file_path))


main()
