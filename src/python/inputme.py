import sys

if __name__ == '__main__':
    n = len(sys.argv)
    print("n: ", n)
    for i in range(0, n):
        print(sys.argv[i], end="\n")
