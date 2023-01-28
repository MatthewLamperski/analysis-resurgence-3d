import * as React from 'react';
import * as ReactDOM from 'react-dom/client'
import {useEffect, useCallback, useState, useMemo, useRef} from "react";
import './App.css'
import TargetAltControl from "./screens/TargetAltControl";
import CuePairingAnalysis from "./screens/CuePairingAnalysis";

const App = () => {
  useEffect(() => {
    window.api.send('toMain', {
      command: 'check updates'
    })
    window.api.receive('fromMain', (event, args) => {
      console.log('Event received from main', JSON.stringify(event, null, 2))
    })
  }, [])
  const [colorScheme, setColorScheme] = useState('dark')
  const [screen, setScreen] = useState('menu')
  const goToTargetAltControl = useCallback(() => {
    setScreen('targetAltControl')
  }, [])
  const goToCuePair = useCallback(() => {
    setScreen('cuePairingAnalysis')
  }, [])
  const renderScreen = useCallback(() => {
    if (screen === 'menu') {
      return (
        <div style={{
          display: 'flex',
          flex: 1,
          alignSelf: 'stretch',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          flexDirection: 'column',
        }}>
          <h3 style={{color: colorScheme === 'dark' ? '#d3d3d3' : 'black', marginBottom: 0}}>What do you want to
            do?</h3>
          <div
            onClick={goToTargetAltControl}
            className="optionBar"
            style={{
              alignSelf: 'stretch',
              backgroundColor: '#333333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 20,
              border: '1px solid #363636',
              padding: 20,
              margin: 10,
              marginTop: 25
            }}>
            <h3 style={{color: colorScheme === 'dark' ? '#d3d3d3' : 'black', margin: 0}}>Target Alt Control
              Analysis</h3>
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1Zm0 6.833c0-.337.209-.64.53-.77a.875.875 0 0 1 .933.181l4.286 4.167a.817.817 0 0 1 0 1.178l-4.286 4.167a.875.875 0 0 1-.934.18.833.833 0 0 1-.529-.77V14H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h5V7.833Z"
                fill="#d3d3d3"
              />
            </svg>
          </div>
          <div style={{alignSelf: 'stretch', justifyContent: 'center', display: 'flex', marginTop: 5}}>
            <a style={{textDecorationColor: '#787878'}} target="_blank"
               href="https://teams.microsoft.com/l/chat/0/0?users=matthewlamperski@ufl.edu">
              <h5 style={{
                color: colorScheme === 'dark' ? '#787878' : 'black',
                margin: 0,
                cursor: 'pointer',
                textDecorationColor: '#787878'
              }}>Need more
                functionality?</h5>
            </a>

          </div>
          {/*<div*/}
          {/*  onClick={goToCuePair}*/}
          {/*  className="optionBar"*/}
          {/*  style={{*/}
          {/*    alignSelf: 'stretch',*/}
          {/*    backgroundColor: '#333333',*/}
          {/*    display: 'flex',*/}
          {/*    justifyContent: 'space-between',*/}
          {/*    alignItems: 'center',*/}
          {/*    borderRadius: 20,*/}
          {/*    border: '1px solid #363636',*/}
          {/*    padding: 20,*/}
          {/*    margin: 10,*/}
          {/*    marginTop: 25*/}
          {/*  }}>*/}
          {/*  <h3 style={{color: colorScheme === 'dark' ? '#d3d3d3' : 'black', margin: 0}}>Cue Pair Analysis</h3>*/}
          {/*  <svg*/}
          {/*    width={20}*/}
          {/*    height={20}*/}
          {/*    viewBox="0 0 24 24"*/}
          {/*    fill="none"*/}
          {/*    xmlns="http://www.w3.org/2000/svg"*/}
          {/*  >*/}
          {/*    <path*/}
          {/*      fillRule="evenodd"*/}
          {/*      clipRule="evenodd"*/}
          {/*      d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1Zm0 6.833c0-.337.209-.64.53-.77a.875.875 0 0 1 .933.181l4.286 4.167a.817.817 0 0 1 0 1.178l-4.286 4.167a.875.875 0 0 1-.934.18.833.833 0 0 1-.529-.77V14H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h5V7.833Z"*/}
          {/*      fill="#d3d3d3"*/}
          {/*    />*/}
          {/*  </svg>*/}
          {/*</div>*/}
        </div>
      );
    } else if (screen === 'targetAltControl') {
      return <TargetAltControl setScreen={setScreen}/>
    } else if (screen === 'cuePairingAnalysis') {
      return <CuePairingAnalysis setScreen={setScreen}/>
    }
  }, [screen])
  return (
    <div style={{
      height: '100vh',
      width: '100%',
      backgroundColor: colorScheme === 'dark' ? "#191919" : "#fff",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      overflow: 'scroll',
    }}>
      <div style={{width: '100%', height: 32, WebkitAppRegion: 'drag'}}/>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: 30,
        marginTop: 10,
      }}>
        <svg
          data-bbox="27.4 38.025 150 123.875"
          viewBox="27.4 38.025 150 123.875"
          height={30}
          width={30}
          xmlns="http://www.w3.org/2000/svg"
          data-type="color"
          aria-hidden="true"
        >
          <defs>
            <style>
              {
                '#comp-jehvibz0 svg [data-color="1"]{fill:#848484}#comp-jehvibz0 svg [data-color="2"]{fill:#d2faf7}'
              }
            </style>
          </defs>
          <path
            d="m153 133.5-16.9 8.8-13.981-6.76c-.414.513-1.234.62-1.87.911L135.5 143.8v16.1l-32.155-15.673a9.341 9.341 0 0 0-1.688.902L135.9 161.8c.1.1.2.1.4.1.1 0 .3 0 .4-.1l18.9-9.9c.3-.1.4-.4.4-.7v-17.6c0-.5-.6-.9-.9-1l-14.436-6.81-1.261 1.261L153 133.5zm1.4 17.2-17.3 9.1v-16.2l17.3-9.1v16.2z"
            fill="#fff"
            data-color={1}
          />
          <path
            d="M50 65.2V49.8l31.45 15.089 2.043-.976L51 48.4l15.9-8.7 33.859 16.074 1.896-.899L67.2 38.1c-.2-.1-.5-.1-.8 0l-17.7 9.6c-.1.1-.2.1-.2.2l-.1.1v17.7c0 .3.2.6.5.7l15.096 7.266 1.41-.99L50 65.2zM177 90.4l-36.45-17.301-2.039 1.133L174.7 91.4l-106 51.2-17.2-9 87.6-41.4c.3-.1.5-.4.5-.7s-.2-.6-.5-.7l-17.405-8.341-1.736.822L136.8 91.3l-16.3 7.8-16.234-7.816-1.987.959L118.6 100l-68.9 32.6c-.9.4-.9 1.4-.9 1.4v17.2c0 .3.2.6.4.7l18.9 9.9c.1.1.2.1.4.1.1 0 .2 0 .4-.1l108-52.5c.3-.1.5-.4.5-.7V91.2s0-.6-.4-.8zM67.7 159.9l-17.3-9v-16.3l17.3 9.1v16.2zm108-51.8L69.3 159.9v-16l106.4-51.4v15.6z"
            fill="#fff"
            data-color={2}
          />
          <path
            d="M156 66.4c.3-.1.5-.4.5-.7V48.5c0-.1 0-.3-.1-.4l-.1-.1c-.1-.1-.1-.2-.2-.2l-17.7-9.6c-.2-.1-.5-.1-.8 0L27.9 90.4c-.1 0-.1.1-.2.2l-.1.1c-.2.2-.2.3-.2.4v17.5c0 .3.2.6.5.7l35.086 16.995 1.745-.828L29 108.1V92.5l52.172 25.122 1.93-.925L30.1 91.2l107.7-51.5 15.9 8.7-88.3 42.1c-.3.1-.5.4-.5.7s.2.6.5.7l18.2 8.6 16.922 8.053 1.791-.847L86.2 100m68.4-34.8L84 99l-16.3-7.7 86.9-41.5v15.4z"
            fill="#fff"
            data-color={1}
          />
        </svg>
        <h4 style={{paddingLeft: 10, color: colorScheme === 'dark' ? '#d3d3d3' : 'black'}}>TABS Lab</h4>
        <h4 style={{paddingLeft: 10, color: colorScheme === 'dark' ? '#d3d3d3' : 'black', fontWeight: 200}}>|</h4>
        <h4 style={{paddingLeft: 10, color: colorScheme === 'dark' ? '#d3d3d3' : 'black', fontWeight: 200}}>Analysis
          Resurgence 3D</h4>
      </div>
      <div style={{
        alignSelf: 'stretch',
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        padding: 30,
        position: 'relative',
      }}>
        {renderScreen()}
      </div>
    </div>
  )
}

const render = () => {
  let root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(<App/>)
}
render();

