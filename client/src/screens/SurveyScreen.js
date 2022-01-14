import React from 'react';
import styled, {keyframes} from 'styled-components';
import Button from '@material-ui/core/Button';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { useHistory } from 'react-router-dom';
import API from '../api';
import * as Session from '../session';

export default function SurveyScreen(props) {
    const api = new API();
    const history = useHistory();
    const [selectGens,setSelectgens] = React.useState([]);
    const [genres,setGenres] = React.useState([]);
    // get genres
    React.useEffect(() => {
        Session.getOptions()
        .then(res =>{
            setGenres(res.genres);
        })
        .catch(err => console.log(err['message']))
  

    },[])

    const onSubmit = (e) => {
        // stop auto redirect
        e.preventDefault();
        

        const data = {
            likedGenre: selectGens,
        }

        console.log(data);
        // send survey data
        api.postJSON('user/survey', data, Session.authHeader())
            .then((r) => {
                history.go(-2);
             })
            .catch((err) => alert(err['message']));
    };

    // if user not logged in redirect to home
    if (!Session.getToken()) history.push('/');

	return (
		<Screen>
          <Header>Help us recommend you better Movies. Take a quick survey.</Header>
          <Form onSubmit={onSubmit} autoComplete="off">
            <Label htmlFor="genres">
                <span> What are some of your favourite movie genres? </span>
                <Box>
                    <Autocomplete
                        multiple
                        id="tags-standard"
                        options={genres}
                        getOptionLabel={(option) => option}
                        renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            
                        />
                        )}
                        value={selectGens}
                        onChange={(event, value) => setSelectgens(value)}
                        
                    />
                </Box>

            </Label>
            <Button 
                type="submit"
                variant="contained" 
                size="large" 
                color="primary"
            >
                Submit
            </Button>
            <SkipContainer>
                <SkipButton
                    type="button"                          
                    onClick={() => { history.go(-2); }}
                >
                    Skip &nbsp;<i className="fas fa-chevron-right"></i>
                </SkipButton>
            </SkipContainer>
        </Form>      
        </Screen>
	);
}

// animation
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


const Screen = styled.section`
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100vw;
    height:100vh;
    background: #eee;
    overflow: scroll;
    
    animation-delay: 0s;
    animation-name: ${fade};
    animation-duration: 0.5s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`;

const Header = styled.header`
    width: 30vw;
    color: #999;
    font-size: 2rem;
    font-weight: 500;
    text-align: center;
    margin-top: 150px;
    opacity: 0;
    animation-delay: 1s;
    animation-name: ${fade};
    animation-duration: 0.8s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: forwards;
`;

const Form = styled.form`
    margin-top: 100px;
    border: none;
    width: min(80vw, 650px);
    min-height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    > * {
        margin-bottom: 100px;
    }

    > :nth-child(1) {
        opacity: 0;
        animation-delay: 1.5s;
        animation-name: ${fade};
        animation-duration: 0.8s;
        animation-timing-function: ease-in-out;
        animation-fill-mode: forwards;
    }

    > :nth-child(2) {
        opacity: 0;
        animation-delay: 2s;
        animation-name: ${fade};
        animation-duration: 0.8s;
        animation-timing-function: ease-in-out;
        animation-fill-mode: forwards;
    }

    > :nth-child(3) {
        opacity: 0;
        animation-delay: 2.5s;
        animation-name: ${fade};
        animation-duration: 0.8s;
        animation-timing-function: ease-in-out;
        animation-fill-mode: forwards;
    }
`;

const Label = styled.label`
    display: flex;
    flex-direction: column;
    width: 80%;
    > * {
        min-height: 30px;
    }

    > input {
        width: 97%;
        font-size: 1.5rem;
        height: 40px;
        border: none;
        padding: 10px;
        border-radius: 20px;
    }

    > span {
        margin-bottom: 20px;
        margin-left: 0px;
        font-size: min(6vw, 1.5rem);
        color: #999;
    }

`;

const SkipContainer = styled.section`
    display: flex;
    align-items: baseline;
    justify-content: center;
    flex-wrap: wrap;
    
    > * {
        color: white;
        font-size: 1rem;
    }
    
`;

const SkipButton = styled.button`
    margin-top: 80px;
    background: none;
    border:none;
    padding: 0;
    font-size: 1.1rem;
    font-weight: bold;
    color: #999;
    &:hover {
      text-decoration-line: underline;
      text-decoration-thickness: 2px;
    }
`;

const Box = styled.section`
    background: white;
    padding: 30px;
    border-radius: 10px;
    span.MuiChip-label {
        padding: 10px;
        font-size: min(6vw, 1.2rem);
        color: #999;
    }
`;
