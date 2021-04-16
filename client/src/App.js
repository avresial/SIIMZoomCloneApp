import React, { useEffect, useState, useRef } from 'react'
import LeftPanel from './Assets/LeftPanel/LeftPanel'
import RightPanel from './Assets/RightPanel/RightPanel'
import Container from 'react-bootstrap/Container'
import StarterPanel from './Assets/StarterPanel/StarterPanel'
import 'bootstrap/dist/css/bootstrap.min.css';
import LoggerBox from './Assets/LoggerBox/LoggerBox'

const io = require('socket.io-client');
const socket = io('127.0.0.1:8000', { autoConnect: false });

const getTimeOfMessage = () => {
  let date = new Date();
  let parsedDate = `${date.getHours()}:${date.getMinutes()}`;
  return parsedDate;
};

const App = () => {
  const [yourUserName, setName] = useState('default');
  const [isNameSet, setIsNameSet] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [messageList, setMessageList] = useState([]);
  const [listOfConnections, setListOfConnections] = useState([]);
  const [logList, setLogList] = useState([]);
  const logTimeout = useRef();

  useEffect(() => {
    socket.on('connect', () => {
    });
  
    socket.on('message', (data) => {
      onMessageGet(data);
    });
  
    socket.on('connections', (data) => {
      const tempList = JSON.parse(data);
      setListOfConnections(listOfConnections => ([...listOfConnections, ...tempList]));
    });
  
    socket.on('add-connection', (data) => {
      const parsedData = JSON.parse(data);
      const newConnection = [{sid: parsedData.sid, name: parsedData.name}];
      appendNewLog(`${parsedData.sid} connected to the server`);
      setListOfConnections(listOfConnections => ([...listOfConnections, ...newConnection]));
    });
  
    socket.on('remove-connection', (sid) => {
      appendNewLog(`${sid} disconnected from the server`);
      setListOfConnections(listOfConnections => {
        const tempList = [...listOfConnections];
        tempList.map( (connection, index) => {
          if (connection.sid === sid)
          {
            tempList.splice(index, 1);
          }
          return 0;
        });
        return tempList;
      });
    });
  }, []);

  const onButtonClickHandler = () => {
    setVideoOn(!videoOn);
  };

  const onMessageSend = (text) => {
    let time = getTimeOfMessage();
    const temporaryList = [{sender: 'You', type: 'user', message: text, time: time}];
    setMessageList(messageList => ([...messageList, ...temporaryList]));
    let nameAndSid = `${yourUserName}(${socket.id})`;
    let message = {senderName: nameAndSid, data: text};
    socket.emit('chat', message);
  };

  const onMessageGet = (data) => {
    let time = getTimeOfMessage();
    const temporaryList = [{sender: data.senderName, type: 'guest', message: data.data, time: time}];
    setMessageList(messageList => ([...messageList, ...temporaryList]));
  };

  const SendConnectionRequest = (index) => {
    const data = listOfConnections[index].sid;
    socket.emit('send-invitation', data);
  };

  const setUserName = (userName) => {
    socket.connect();
    setName( yourUserName => {
      yourUserName = userName;
    });
    setIsNameSet(true);
    socket.emit('name', userName);
    socket.emit('connections');
  };

  useEffect( () => {
    if (!logTimeout.current) {
      logTimeout.current = setTimeout(popFrontLogList, 5000);
    }
  }, [logList])

  const popFrontLogList = () => {
    setLogList(logList => {
      const tempLogList = [...logList];
      logTimeout.current = null;
      tempLogList.shift();
      logList = tempLogList;
      return logList;
    });
  }; 

  const appendNewLog = (text) => {
    setLogList(logList => {
      const tempLogList = [...logList];
      tempLogList.push(text);
      logList = tempLogList;
      return logList;
    })
  };

  return(
    <Container fluid>
      {
        logList.length > 0
          ? <LoggerBox itemsCount={logList.length}>{logList[0]}</LoggerBox>
          : null
      }
      {
        isNameSet ?
        <div className = 'row vh-100'>
          <LeftPanel connections={listOfConnections} sendRequest={SendConnectionRequest} />
          <RightPanel onVideoButtonClick={onButtonClickHandler} onSendButtonClick={(text) => onMessageSend(text)} videoOn={videoOn} messageList={messageList}/>
        </div>
        : <StarterPanel OnClick={(userName) => setUserName(userName)}></StarterPanel>
      }
    </Container>
  );
}

export default App;
