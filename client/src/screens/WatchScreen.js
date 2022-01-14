import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import API from '../api';
import * as Session from '../session';

export default function WatchScreen() {
    const api = new API();
    const history = useHistory();
    const { id } = useParams();
    const [err, setErr] = React.useState('');
    const [title, setTitle] = React.useState(' ');
    const ref = React.useRef(null);

    // fetch movie
    React.useEffect(() => {
        ref.current.scrollIntoView();
        // fetch movie title
        api.getJSON(`movie/${id}`, Session.authHeader())
            .then(res=>{
                setTitle(res.title);
                setErr('Woops! Unable to retreive your movie, please come back later. (~_^)')
            }).catch((err) => alert(err['message']));
    }, [])

    // if user not logged in redirect to home
    if (!Session.getToken()) history.push('/');

	return (
		<Screen>
			<VideoContainer ref={ref}>
                <header> {title} </header>
                <Video>
                    {err ? <span> {err} </span> : <i className="fa fa-spinner fa-spin"></i>}
                </Video>
			</VideoContainer>
		</Screen>
	);
}

const Screen = styled.section`
	border: none;
	width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const VideoContainer = styled.section`
    > header {
        color: white;
        font-size: min(7vw, 2rem);
        margin: 70px 0 10px 20px;
        font-weight: 500;
        min-height: 2.5rem;
    }
`;

const Video = styled.section`
    width: 90vw;
    height: 40vw;
    background: #111;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 5rem;
    > span {
        text-align: center;
        font-size: min(5vw, 2rem);
        width: 40vw;
    }
`;