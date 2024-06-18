import React, { useEffect, useState, useRef } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { marked } from 'marked';
import './index.css';

const client = new W3CWebSocket('https://l93oj662ud.execute-api.us-west-2.amazonaws.com/production');
const INACTIVITY_TIMEOUT = 180000; // 3 mins

const TypingIndicator = () => {
  return (
    <div className='typing-indicator-container'>
      <div className="img-container">
          <img src="/IITW_BOT_LOGO.svg" alt="Investing In The Web ChatBot logo" />
      </div>
      <div className="typing-indicator">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
}


function App() {

  const [chatHistory, setChatHistory] = useState([{ sender: 'bot', message: "Hello! I'm BrokerBot. I can assist you with finding any information on InvestingInTheWeb. What would you like to know today?" }]);

  const [message, setMessage] = useState('');
  const timeoutIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false)


  const toggleChatVisibility = () => {
    setIsChatVisible(!isChatVisible);
  };

  const minimizeChat = () => {
    setIsChatVisible(false);
  };

  useEffect(() => {
    console.log(chatHistory)
    client.onopen = () => {
      console.log('WebSocket connection opened');
      resetInactivityTimeout();
    };

    client.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('THE DATA: ', data)
      setIsLoading(false)
      setChatHistory(prevHistory => [...prevHistory, { sender: 'bot', message: data.response.text, sources: data.response.srcs }]);
      resetInactivityTimeout();
    };

    client.onclose = () => {
      setChatHistory([{ sender: 'bot', message: "Hello! I'm BrokerBot. I can assist you with finding any information on InvestingInTheWeb. What would you like to know today?" }])
      console.log('WebSocket connection closed');
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault(); 
      closeWebSocket();
    };

    window.addEventListener('unload', handleBeforeUnload);

    // Clean up event listeners and close the WebSocket connection when the component unmounts
    return () => {
      window.removeEventListener('unload', handleBeforeUnload);
      clearTimeout(timeoutIdRef.current);
      closeWebSocket();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const resetInactivityTimeout = () => {
    clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(closeWebSocketAndReload, INACTIVITY_TIMEOUT);
  };

  const closeWebSocketAndReload = () => {
    closeWebSocket();
    location.reload();
  }

  const closeWebSocket = () => {
    if (client && client.readyState === WebSocket.OPEN) {
      client.close();
      setChatHistory([{ sender: 'bot', message: "Hello! I'm BrokerBot. I can assist you with finding any information on InvestingInTheWeb. What would you like to know today?" }])
      console.log('WebSocket connection closed');
    }
  };

  const sendMessage = () => {
    if (client.readyState !== WebSocket.OPEN) return;
    setIsLoading(true)
    const messagePayload = JSON.stringify({ question: message });
    client.send(messagePayload);
    setChatHistory(prevHistory => [...prevHistory, { sender: 'user', message }]);
    setMessage('');
    resetInactivityTimeout();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
      setMessage('');
    }
  };

  return (
    <div>
      {
        !isChatVisible ? 
          <button className="toggle-chat-button" onClick={toggleChatVisibility}>
            <div className="label">Chat with the entire website!</div>
            <img src="/IITW_BOT_LOGO.svg" alt="Chat Icon" />
          </button> : (
        <div className="chat-container">
          <div className="chat-box">
            <div className="chat-header">
              <div className="chat-bot-info">
                <img src="/IITW_BOT_LOGO.svg" alt="Investing In The Web ChatBot logo" />
                <p>BrokerBot</p>
              </div>
              <div className="window-controller">
                <span onClick={minimizeChat}><img src="/min.svg" alt="Minimize Chat window" /></span>
              </div>
            </div>
            <div className="chat-log">
              {chatHistory.map((chat, index) => (
                <div key={index} className={chat.sender === 'bot' ? 'bot-message' : 'user-message'}>
                  {chat.sender === 'bot' && (
                    <div className="img-container">
                      <img src="/IITW_BOT_LOGO.svg" alt="Investing In The Web ChatBot logo" />
                    </div>
                  )}
                  <div className={chat.sender === 'bot' ? 'bot-inner-message' : 'user-inner-message'}>
                    {chat.sender === 'bot' ? (
                      <div dangerouslySetInnerHTML={{ __html: marked(chat.message) }} />
                    ) : (
                      <div>{chat.message}</div>
                    )}
                    {chat.sender === 'bot' && chat.sources && chat.sources !== 'none' && (
                      <div className="notes-container">
                        <span>Sources:</span> <br />
                        <ol className="notes-list">
                          {chat.sources.map((source, index) => (
                            <li key={index} className="notes-item">
                            <b>{index + 1}.</b> <a href={source} target="_blank" rel="noopener noreferrer">
                                {source}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && <TypingIndicator />} 
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-area">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="chat-input"
                placeholder="Type your message..."
              />
              <button onClick={sendMessage} className="chat-send-button">
                <img src="/send.svg" alt="send-message-icon" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
}

export default App;
