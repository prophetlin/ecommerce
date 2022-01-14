import React from 'react';
import styled from 'styled-components';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { useHistory } from 'react-router-dom';
import API from '../api';
import * as Session from '../session';

export default function RegisterScreen() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [bdate, setBdate] = React.useState('');
    const api = new API();
    const history = useHistory();
    const onSubmit = (e) => {
        // stop auto redirect
        e.preventDefault();

        if (!email || !password || !bdate) {
            alert('Missing entries.');
            return;
        }

        const data = {
          email,
          password,
          birthDate: bdate,
        };

        // submit register to backend
        console.log(data);
        api.postJSON('auth/register', data)
           .then((r) => {
              console.log(r);
              // store session token
              Session.setToken(r.token);             
              // redirect to prev page
              history.push('/survey');
            })
           .catch((err) => alert(err['message']));
    };

    // if user logged in redirect to home
    if (Session.getToken()) history.push('/');

	return (
        <Screen>
            <Form onSubmit={onSubmit} autoComplete="off">
                <Header>Register</Header>
                <Label htmlFor="email">
                  <span>Email:</span>
                  <input
                      type="text"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                  />
                </Label>
                <Label htmlFor="password">
                  <span>Password:</span>
                  <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                  />
                </Label>
                <Label htmlFor="bdate">
                  <span> Date of Birth </span>
                  <input
                      type="date"
                      id="bdate"
                      name="bdate"
                      value={bdate}
                      onChange={(e) => setBdate(e.target.value)}
                  />
                </Label>
                <Button 
                    type="submit"
                    variant="contained" 
                    size="large" 
                    style={{ backgroundColor: 'white' }}
                >
                    Submit
                </Button>
                <RegisterContainer>
                    <span> Already have an account? </span>
                    <Button                          
                        color="primary"
                        style={{ 
                            fontSize: '1.2rem',
                            fontWeight: 'bold', 
                            textTransform: 'none', 
                        }}
                        onClick={() => { history.push('/login'); }}
                    >
                        Sign in
                    </Button>
                </RegisterContainer>
            </Form>
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

const Form = styled.form`
    margin-top: 150px;
    border: none;
    width: min(80vw, 650px);
    min-height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    > * {
        margin-bottom: 40px;
    }
`;

const Header = styled.header`
    font-weight: bold;
    font-size: 2.5rem;
    color: white;
`;

const Label = styled.label`
    display: flex;
    flex-direction: column;
    width: 70%;
    > * {
        min-height: 30px;
    }

    input {
        width: 100%;
        font-size: 1.5rem;
        height: 40px;
    }

    span {
        margin-bottom: 5px;
        font-size: min(6vw, 1.5rem);
        color: white;
    }
`;

const RegisterContainer = styled.section`
    display: flex;
    align-items: baseline;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 50px;
    > * {
        color: white;
        font-size: 1rem;
    }
`;