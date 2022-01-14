import React, { Component,useState } from 'react';
import styled from 'styled-components';
import Chatbot from 'react-chatbot-kit';
import { createChatBotMessage } from "react-chatbot-kit";
import API from '../api';
import Thumbnail from './Thumbnail';
import * as Session from '../session';
import { useHistory, useLocation } from "react-router-dom";
import Button from '@material-ui/core/Button';
// import avatar from "images/avatar.jpg"
export default function Chatbot2(props) {
    return(
            <Chatbot config={config} actionProvider={ActionProvider} messageParser={MessageParser} />
    );

}

// convert text into message object
function txtMsg(txt) {
    return {Type:'text', Content:txt};
}

const ChatBoxContainer = styled.div`
  position: fixed;
  right:100px;
  bottom:0;

  width: 400px;
  height:600px;
  background-color:white;
`

class MessageParser {
    api = new API();
    constructor(actionProvider, state) {
      this.actionProvider = actionProvider;
      this.state = state;
    }
  
    parse(message) {

        
        const data = {
            message:{
                from:"user",
                type:"text",
                content: message
            }
        }
        
        // send user message to backend
        this.api.postJSON('chatbot', data, Session.authHeader())
        .then((r) => {
            // render response message
            console.log(r);
            this.actionProvider.createMessage(r)
         })
        .catch((err) => alert(err['message']));

        
    }
  }
  

  
// ActionProvider starter code
class ActionProvider {
    constructor(createChatBotMessage, setStateFunc, createClientMessage) {
        this.createChatBotMessage = createChatBotMessage;
        this.setState = setStateFunc;
        this.createClientMessage = createClientMessage;
    }

    confused() {
        const confusedMessage = this.createChatBotMessage(txtMsg("I only talk about movie"))
        this.updateChatbotState(confusedMessage)
    }
    movie() {
        const movieMessage = this.createChatBotMessage(txtMsg("movie is good"))
        this.updateChatbotState(movieMessage)
    }
    createMessage(message){
        this.updateChatbotState(this.createChatBotMessage(message))
    }
    
    updateChatbotState(message) {

        this.setState(prevState => ({
            ...prevState, messages: [...prevState.messages, message]
        }))
    }

}
  

  
// Config starter code
const config = {
    initialMessages: [
        createChatBotMessage(txtMsg("Hi, I'm here to help. What can I do for you"), {
            widget: "learningOptions",
        }),
    ],

    botName:"Mflix super bot",
    customComponents: {
        botAvatar: (props) => <BotAvatar {...props} />,
        botChatMessage: (props) => MyMessage(props)
    },
}
  

// bot icon
const BotAvatar = () => {
    return (
      <div className="react-chatbot-kit-chat-bot-avatar">
        <div className="react-chatbot-kit-chat-bot-avatar-container">
          <Icon src="/images/avatar3.png" alt='bot icon' />
        </div>
      </div>
    );
  };


const Icon = styled.img`
  width:60px;
`;

// message box
const MyMessage = (props) => {
    // console.log(props)
    const content = props.message.Content;
    const type = props.message.Type;
    // render message based on type
    return (
        <Dialogue className="react-chatbot-kit-chat-bot-message">
            {type === 'text' && <span> {content} </span>}
            {type === 'search link' && <Search link={content} />}
            {type === 'movie' && <Recommend movie={content} />}
        </Dialogue>
    );
}

const Dialogue = styled.section`
    padding: 10px;
`;

const DialogueWrap = styled.section`
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    > a {
        color: white;
        text-decoration: underline;
        cursor: pointer;
        word-break: break-all
    }

    > :first-child {
        margin-bottom: 10px;
    }

    > header {
        font-size: 1.2rem;
        font-weight: 500;
    }
`;

// search link message
function Search(props) {
    const {link} = props;
    const history = useHistory();
    // parse url parameters
    let urlParams = new URLSearchParams(link.replace('search?', ''));
    let keys = urlParams.get('q');
    if (keys) keys = keys.split('|');

    return (
        <DialogueWrap>
            <span> 
                Are you searching for movies with the {urlParams.get('category').toLowerCase()}{keys.length > 1 ? 's': null}: {keys.join(', ')}?
            </span>
            <Button 
                size="small" 
                variant="contained" 
                color="primary" 
                onClick={() => {history.push(`/${link}`)}}
                style={{ 
                    fontWeight: 'bold', 
                    background: '#504487', 
                }}
            >
                Link
            </Button>
        </DialogueWrap>
    );    
}

// movie recommendation message
function Recommend(props) {
    const {movie} = props;
    return (
        <DialogueWrap>
            <span> This movie matches your description.</span>
            <header> {movie.title} </header>
            <Thumbnail id={movie.id} src={movie.url} alt={movie.title + ' poster'} width='200'/>
        </DialogueWrap>
    )
}
