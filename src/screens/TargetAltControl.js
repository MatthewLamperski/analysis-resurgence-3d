import React, {useCallback, useEffect, useRef, useState} from 'react';
import "../App.css"

const TargetAltControl = ({setScreen}) => {
  const [colorScheme, setColorScheme] = useState('dark')
  const [analyzing, setAnalyzing] = useState(false);
  const [finished, setFinished] = useState()
  const [dragging, setDragging] = useState(false)
  const [analysisConfig, setAnalysisConfig] = useState({
    bin_size: 60,
    bin_num_phase_1: 5,
    auto_exclude: true,
  });
  const handleDragIn = useCallback((e) => {
    e.preventDefault()
    if (!dragging) {
      setDragging(true)
    }
  }, [dragging])
  const handleDragOut = useCallback((e) => {
    if (dragging) {
      setDragging(false)
    }
  }, [dragging])
  const [overrideOptions, setOverrideOptions] = useState()
  const handleReAnalyze = useCallback(() => {
    if (analysisConfig.phases_duration && analysisConfig.phases_duration[0] !== 0) {
      console.log(analysisConfig)
      window.api.send('toMain', {
        ...overrideOptions,
        config: {
          ...analysisConfig,
          bin_num_phase_2_max: analysisConfig.bin_num_phase_1,
          bin_num_phase_3: analysisConfig.bin_num_phase_1,
          phases_duration: analysisConfig.phases_duration.map(duration => duration * 1000)
        }
      })
      setShowDurationOverrideModal(false)
    }
  }, [overrideOptions, analysisConfig])
  useEffect(() => {
    console.log(analysisConfig)
  }, [analysisConfig])
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).map(file => file.path)
    console.log('files', files)
    if (dragging) {
      window.api.send('toMain', {
        command: 'openFilesDialog',
        filePaths: files,
        analysis: 'targetAltControl',
        config: {
          ...analysisConfig,
          bin_num_phase_2_max: analysisConfig.bin_num_phase_1,
          bin_num_phase_3: analysisConfig.bin_num_phase_1
        }
      })
      setDragging(false)
    }
  }, [dragging, analysisConfig])
  const [err, setErr] = useState()
  const [showDurationOverrideModal, setShowDurationOverrideModal] = useState(false);

  const refresh = useCallback(() => {
    setFinished(undefined)
    setErr(undefined)
    setAnalyzing(false)
    setDragging(false)
    setShowDurationOverrideModal(false)
  }, [])
  useEffect(() => {
    window.api.receive('fromMain', (event, args) => {
      console.log('Event received from main', JSON.stringify(event, null, 2))
      if (event[0] === 'dir selected') {
        setAnalyzing(true);
      } else if (event[0] === "error") {
        setErr(event[1])
      } else if (event[0] === "success") {
        setFinished(event[1])
        setAnalyzing(false)
      } else if (event[0] === "override_phases_duration") {
        setShowDurationOverrideModal(true);
        setOverrideOptions(event[1])
      }
    })
  }, [])

  const handleButtonPressed = useCallback(() => {
    if (!(finished || err)) window.api.send('toMain', {
      command: 'openFilesDialog',
      analysis: 'targetAltControl',
      config: {
        ...analysisConfig,
        bin_num_phase_2_max: analysisConfig.bin_num_phase_1,
        bin_num_phase_3: analysisConfig.bin_num_phase_1
      }
    })
  }, [finished, err, analysisConfig])

  const openFile = useCallback(() => {
    window.api.send('toMain', {
      command: 'open file',
      fileName: finished.out_file, analysis: 'targetAltControl'
    })
  }, [finished])
  const backToMainMenu = useCallback(() => {
    if (setScreen) {
      setScreen('menu')
    }
  }, [])
  const handlePhasesDurationChanged = useCallback(e => {
    setAnalysisConfig(prevState => ({
      ...prevState,
      phases_duration: [
        Number(e.target.value),
        Number(e.target.value),
        Number(e.target.value),
      ]
    }))
  }, [])
  const handleBinSizeChanged = useCallback((e) => {
    setAnalysisConfig(prevState => ({
      ...prevState,
      bin_size: Number(e.target.value)
    }))
  }, [])
  const handleBin1Changed = useCallback((e) => {
    setAnalysisConfig(prevState => ({
      ...prevState,
      bin_num_phase_1: Number(e.target.value)
    }))
  }, [])
  const handleBin2Changed = useCallback((e) => {
    setAnalysisConfig(prevState => ({
      ...prevState,
      bin_num_phase_2_max: Number(e.target.value)
    }))
  }, [])
  const handleBin3Changed = useCallback((e) => {
    setAnalysisConfig(prevState => ({
      ...prevState,
      bin_num_phase_3: Number(e.target.value)
    }))
  }, [])
  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
        alignItems: 'flex-start',
        alignSelf: 'stretch'
      }}>
        <div onClick={backToMainMenu} style={{
          cursor: 'pointer',
          flexDirection: 'row',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: 10,
        }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 52 52"
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#969696"
              d="M38 52a2 2 0 0 1-1.41-.59l-24-24a2 2 0 0 1 0-2.82l24-24a2 2 0 0 1 2.82 0 2 2 0 0 1 0 2.82L16.83 26l22.58 22.59A2 2 0 0 1 38 52Z"
              data-name="Group 132"
            />
          </svg>
          <h5 style={{
            color: colorScheme === 'dark' ? '#969696' : 'black',
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 5,
          }}>Target Alt Control</h5>
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignSelf: 'stretch',
        paddingTop: 20,
        paddingBottom: 20
      }}>
        <h4 style={{
          color: colorScheme === 'dark' ? '#b4b4b4' : 'black',
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 5,
        }}>Configuration:</h4>
        <div style={{
          marginTop: 10,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'stretch',
          flex: 1,
          overflow: 'scroll'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
          }}>
            <div style={{
              flexDirection: 'column',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
            }}>
              <h5 style={{
                color: colorScheme === 'dark' ? '#b4b4b4' : 'black',
                marginTop: 0,
                marginBottom: 0,
                marginLeft: 5,
              }}>Bin Size (seconds)</h5>
              <input defaultValue={analysisConfig.bin_size} style={styles.input} type="number"
                     onChange={handleBinSizeChanged}/>
            </div>
            <div style={{
              flexDirection: 'column',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
            }}>
              <h5 style={{
                color: colorScheme === 'dark' ? '#b4b4b4' : 'black',
                marginTop: 0,
                marginBottom: 0,
                marginLeft: 5,
              }}>Bin # (bins in each phase)</h5>
              <input defaultValue={analysisConfig.bin_num_phase_1} style={styles.input} type="number"
                     onChange={handleBin1Changed}/>
            </div>

          </div>

        </div>
        <div style={{
          flexDirection: 'column',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          alignSelf: 'stretch',
          marginTop: 10,
        }}>
          <h5 style={{
            color: colorScheme === 'dark' ? '#b4b4b4' : 'black',
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 5,
          }}>Disable automatic exclusion</h5>
          <input style={{backgroundColor: 'green'}}
                 type="checkbox"
                 onChange={e => {
                   console.log(e.target.checked)
                   setAnalysisConfig(prevState => ({
                     ...prevState,
                     auto_exclude: !e.target.checked
                   }))
                 }}/>
        </div>
      </div>
      <div onMouseEnter={handleDragIn} onMouseLeave={handleDragOut} onClick={handleButtonPressed}
           onDragOver={handleDragIn} onDragLeave={handleDragOut} onDrop={handleDrop} style={{
        width: '100%',
        backgroundColor: (!finished && !err && dragging) ? '#333333' : '#242424',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        border: '1px solid #363636',
        flex: 1,
        transition: "all 0.3s ease",
        WebkitTransition: "all 0.3s ease",
        MozTransition: "all 0.3s ease",
        cursor: (!finished && !err && dragging) ? 'pointer' : 'default'
      }}>
        <div style={{
          justifyContent: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 10
        }}>
          {
            finished && finished.out_file ? (
              <>
                <svg
                  width="25%"
                  height="25%"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>{"success"}</title>
                  <path
                    d="M256 42.667C138.18 42.667 42.667 138.18 42.667 256S138.18 469.333 256 469.333 469.333 373.82 469.333 256 373.82 42.667 256 42.667Zm0 384c-94.105 0-170.667-76.562-170.667-170.667S161.895 85.333 256 85.333 426.667 161.895 426.667 256 350.106 426.667 256 426.667Zm80.336-246.886 30.167 30.167-131.836 132.388-79.084-79.084 30.167-30.166 48.917 48.917L336.336 179.78Z"
                    fill="#37796c"
                    fillRule="evenodd"
                  />
                </svg>
                <h3 style={{color: colorScheme === 'dark' ? '#d3d3d3' : 'black', marginBottom: 0}}>Success!</h3>
                <h5 style={{
                  color: colorScheme === 'dark' ? '#969696' : 'black',
                  marginTop: 5
                }}>{`${finished.files_processed + finished.excluded} total files processed in ${finished.duration} seconds.${analysisConfig.auto_exclude ? `${finished.excluded} ${finished.excluded === 1 ? 'was' : 'were'} automatically excluded.` : ''}`}</h5>

                <div onClick={openFile} style={{
                  cursor: 'pointer',
                  padding: 15,
                  paddingLeft: 30,
                  paddingRight: 30,
                  borderRadius: 15,
                  border: '1px solid #d3d3d3',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <h5 style={{
                    color: colorScheme === 'dark' ? '#d3d3d3' : 'black',
                    marginTop: 0,
                    marginBottom: 2,
                  }}>
                    Open Output File:
                  </h5>
                  <u onClick={openFile} style={{
                    color: colorScheme === 'dark' ? '#969696' : 'black',
                    cursor: 'pointer',
                    fontSize: 12,
                    textAlign: 'center',
                  }}>{`${finished.out_file}`}</u>
                </div>
              </>
            ) : err ? (
              <>
                <svg
                  width="25%"
                  height="25%"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>{"error"}</title>
                  <path
                    d="M256 42.667c117.803 0 213.333 95.53 213.333 213.333S373.803 469.333 256 469.333 42.667 373.803 42.667 256 138.197 42.667 256 42.667Zm0 42.666C161.899 85.333 85.333 161.9 85.333 256S161.9 426.667 256 426.667 426.667 350.1 426.667 256 350.1 85.333 256 85.333Zm48.917 91.584 30.166 30.166L286.165 256l48.918 48.917-30.166 30.166L256 286.165l-48.917 48.918-30.166-30.166L225.835 256l-48.918-48.917 30.166-30.166L256 225.835l48.917-48.918Z"
                    fill="#d04b45"
                    fillRule="evenodd"
                  />
                </svg>
                <h3 style={{color: colorScheme === 'dark' ? '#d3d3d3' : 'black', marginTop: 10}}>{
                  err.title ?? "Something went wrong..."
                }</h3>
                <h5 style={{
                  textAlign: 'center',
                  overflowWrap: 'anywhere',
                  marginTop: 0,
                  color: colorScheme === 'dark' ? '#d3d3d3' : 'black',
                }}>{err.message}</h5>
              </>
            ) : analyzing ?
              (
                <>
                  <div className="spinner"/>
                  <h3 style={{color: colorScheme === 'dark' ? '#d3d3d3' : 'black', marginTop: 10}}>Analyzing...</h3>
                </>
              ) : (
                <>
                  <svg
                    width="25%"
                    height="25%"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 20V4C2 3.44772 2.44772 3 3 3H8.44792C8.79153 3 9.11108 3.17641 9.29416 3.46719L10.5947 5.53281C10.7778 5.82359 11.0974 6 11.441 6H21C21.5523 6 22 6.44772 22 7V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20Z"
                      stroke="#d3d3d3"
                      strokeWidth={2}
                    />
                    <path
                      d="M9 13L12 10L15 13"
                      stroke="#d3d3d3"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 10V17"
                      stroke="#d3d3d3"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </svg>
                  <h3 style={{color: colorScheme === 'dark' ? '#d3d3d3' : 'black', marginBottom: 0}}>Drag and Drop
                    Folder</h3>
                  <h3 style={{color: colorScheme === 'dark' ? '#d3d3d3' : 'black', marginTop: 5}}>(or click)</h3>
                </>
              )
          }
        </div>
      </div>
      {
        (finished || err) &&
        (
          <div style={{
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'stretch',
          }}>
            <u onClick={refresh} style={{
              color: colorScheme === 'dark' ? '#d3d3d3' : 'black',
              cursor: 'pointer',
              fontSize: 12,
              textAlign: 'center',
            }}>Restart</u>
          </div>
        )
      }

      {
        showDurationOverrideModal && (
          <div style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            backgroundColor: "#19191970", //"#19191970"
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <div style={{
              borderRadius: 15,
              backgroundColor: "#191919",
              padding: 30,
              maxWidth: '40%',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              flexDirection: 'column',
              boxShadow: "0 0 10px 10px #FFFfff09"
            }}>
              <h4 style={{
                color: colorScheme === 'dark' ? '#b4b4b4' : 'black',
                marginTop: 0,
                marginBottom: 0,
                marginLeft: 5,
              }}>There was a problem</h4>
              <h5 style={{
                color: colorScheme === 'dark' ? '#969696' : 'black',
                marginTop: 10,
                marginBottom: 20,
                marginLeft: 5,
                fontWeight: 300
              }}>Event markers for the end of phase 1 and 2 were not logged in some of those files. You can either
                manually
                set the duration of each phase, or cancel analysis.</h5>
              <div style={{
                flexDirection: 'column',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
                <h5 style={{
                  color: colorScheme === 'dark' ? '#b4b4b4' : 'black',
                  marginTop: 0,
                  marginBottom: 0,
                  marginLeft: 5,
                }}>Phase duration (seconds):</h5>
                <input
                  style={styles.input}
                  type="number"
                  onChange={handlePhasesDurationChanged}/>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                alignSelf: 'stretch'
              }}>
                <h5
                  onClick={refresh}
                  style={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    color: colorScheme === 'dark' ? '#b4b4b4' : 'black',
                    marginTop: 0,
                    marginBottom: 0,
                    marginLeft: 5,
                  }}>Cancel</h5>
                <div onClick={handleReAnalyze} className={
                  analysisConfig.phases_duration && analysisConfig.phases_duration[0] !== 0 ? 'optionBar' : ''
                } style={{
                  backgroundColor: "#323232",
                  padding: 8,
                  borderRadius: 15,
                  cursor: analysisConfig.phases_duration && analysisConfig.phases_duration[0] !== 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingLeft: 15,
                  paddingRight: 15,
                  marginLeft: 10
                }}>
                  <h5
                    style={{
                      color: colorScheme === 'dark' ? '#b4b4b4' : 'black',
                      marginTop: 0,
                      marginBottom: 0,
                    }}>Analyze</h5>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};
const styles = {
  input: {
    backgroundColor: '#333333',
    borderRadius: 5,
    padding: 5,
    margin: 5,
    border: 'none',
    color: '#d3d3d3',
    flex: 1,
    minWidth: 5,
    maxWidth: 150,
  }
}

export default TargetAltControl;
