import React from 'react';
import styled, {keyframes} from 'styled-components';
import ChatbotMain from './ChatbotMain';

// Chatbot framework

// animations
const fade = keyframes`
  from {
    opacity: 0;
    pointer-events: none;
  }

  to {
    opacity: 100%;
    pointer-events: auto;
  }
`;

const transition = keyframes`
  from {
    bottom: 30px;
    right: 100px;
  }

  to {
    bottom: 475px;
    right: 410px;
  }
`;

// chatbot icon plus frame
export default function Chatbot(props) {
    const [direction, setDirection] = React.useState(false);
    const [animationIcon, setAnimationIcon] = React.useState(undefined);
    const [animationBox, setAnimationBox] = React.useState(undefined);
    const handleAnimate = () => {
        // start animantion
        setAnimationBox(fade);
        setDirection(!direction);
    }
	return (
		<Container>
            <Icon key={direction} onClick={handleAnimate} direction={direction} animation={animationIcon} ><img src="/images/avatar3.png" alt="avatar"/></Icon>
            <Chatbox key={!direction}  direction={direction} animation={animationBox}>
                <ChatbotMain />
            </Chatbox>
		</Container>
	);
}

const Container = styled.section`
    pointer-events: none;	
    background: none;
	position: fixed;
    z-index: 1;
	bottom: 0;
    right: 0;
    display: flex;
    justify-content: flex-end;
`;

const Chatbox = styled.section`
    .react-chatbot-kit-chat-container {
        width: 300px;
    }
    pointer-events: none;
    opacity: 0;
    display: flex;
    flex-direction: column;
    width: 290px;
    height: 500px;
    margin: 0 90px 100px 0;
    border-radius: 2%;
    animation-name: ${props => props.animation};
    animation-duration: 0.5s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
    animation-direction: ${props => props.direction ? 'normal':'reverse'};
`;

const Icon = styled.section`
    pointer-events: auto;
    z-index: 1;
    position: absolute;
    bottom: 30px;
    right: 100px;
    > img {
        background: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
     
    }
    animation-name: ${props => props.animation};
    animation-duration: 0.8s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
    animation-direction: ${props => props.direction ? 'normal':'reverse'};
`;
