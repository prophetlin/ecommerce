import React from 'react';
import styled from 'styled-components';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { useHistory } from 'react-router-dom';
import API from '../api';
import * as Session from '../session';
import Tag from '../components/Tag';
import Autocomplete from '@material-ui/lab/Autocomplete';
import LoadingBox from '../components/LoadingBox';

export default function ProfileScreen() {
    const history = useHistory();
    const [email, setEmail] = React.useState('');
    const [bdate, setBdate] = React.useState('');
    const [selectGenres, setSelectGenres] = React.useState([]);
    const [likedGenres, setLikedGenres] = React.useState([]);
    const [edit, setEdit] = React.useState(false);
    const [genres, setGenres] = React.useState([]);
    const [load, setLoad] = React.useState(false);
    const api = new API();
    React.useEffect(() => {
        // none logged users are directed to home
        if (!Session.getToken()) {
            history.push('/');
            return;
        }

        // fetch profile data
        api.getJSON('user/profile', Session.authHeader())
            .then((r) => {
                console.log(r);
                setEmail(r.email);
                setBdate(r.birthDate);
                setSelectGenres([...r.likedGenre]);
                setLikedGenres([...r.likedGenre]);
            })
            .catch((err) => console.log(err['message']));
    }, []);

    // handle editing favourite genres
    const handleEdit = () => {
        if (!edit) {
            // fetch genres
            Session.getOptions()
                .then(res =>{
                    setGenres(res.genres);
                    setEdit(true);
                })
                .catch(err => console.log(err['message']))
        } else if(!load) {
            setLoad(true);

            const data = {
                likedGenre: selectGenres,
            }

            console.log(data);
            // send updated genres
            api.postJSON('user/survey', data, Session.authHeader())
                .then((r) => {
                    setEdit(false);
                    setLoad(false);
                    setLikedGenres([...selectGenres]);
                 })
                .catch((err) => alert(err['message']));
        }
    }

    // show loading screen while fetching profile
    if (!email) return(<Screen><LoadingBox /></Screen>);
    
    // favourite genre list
    const favGenres = likedGenres.length === 0 ? <span>No favourites.</span> :
        <Items><span>Favourite Genres:</span> {likedGenres.map(genre=> <Tag type="Genre" name={genre} outline="#0e1025"/>)}</Items>;

	return (
        <Screen>
            <Section>
                <UserIcon>
                    <img src="./images/userIcon.svg" alt='user icon' />
                </UserIcon>
                <Label>
                  <span>Email:</span>
                  <span>{email}</span>
                </Label>
                <Label>
                  <span>Date of Birth:</span>
                  <span>{bdate}</span>
                </Label>
            </Section>
            <Section>
                <div/>
                <Label>
                  {edit ? <span>Favourite Genres:</span> : null}
                  {edit ? <Box>
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
                                    value={selectGenres}
                                    onChange={(event, value) => setSelectGenres(value)}
                                    
                                />
                            </Box>
                            :
                            favGenres
                    }
                </Label>
                <Edit>
                    {!load && edit && <Button
                                            onClick={() => {setEdit(false)}}
                                            variant="contained" 
                                            size="large"
                                            color="secondary"
                                            style={{ 
                                                    fontSize: '1rem',
                                                    fontWeight: 'bold', 
                                                    color: 'white',
                                                    margin: '0 20px' 
                                                }}
                                        >
                                            Cancel
                                        </Button>
                    }
                    <Button 
                        onClick={handleEdit}
                        variant="contained" 
                        size="large"
                        color= {edit ? "primary" : "secondary"} 
                        
                        style={{ 
                                fontSize: '1rem',
                                fontWeight: 'bold', 
                                color: 'white', 
                            }}
                    >
                        {load && <i className="fas fa-spinner fa-spin" style={{fontSize: "1.75rem"}}/>}
                        {!load && edit && 'submit'}
                        {!load && !edit && 'edit'}
                    </Button>
                </Edit>
            </Section>
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

const Section = styled.section`
    margin-top: 120px;
    border: none;
    width: min(80vw, 650px);
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
    > :nth-child(2) {
        
        border-bottom: 2px solid #eee;
    }

    border-radius: 10px;
    padding: 10px 20px;
`;

const Header = styled.header`
    font-weight: bold;
    font-size: 3.5rem;
    color: white;
`;

const Label = styled.label`
    display: flex;
    align-items: center;
    width: 100%;
    /*box-shadow: 1px 0 5px #ccc;*/
    span {
        margin: 10px;
        font-size: min(6vw, 1.5rem);
    }

    span:first-child {
        font-weight: 500;
    }
    padding: 10px;
`;

const Edit = styled.section`
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 10px;
    > * {
        margin: 10px;
    }


`;

const UserIcon = styled.section`
    display: flex;
    justify-content: center;
    width: 100%;
    img {
        width: 200px;
        margin: 50px 0;
        /*filter: invert(.75);*/
    }

`;

const Items = styled.section`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    > * {
        margin: 5px 10px;
    }
`;

const Box = styled.section`
    width: 100%;
    padding: 30px;
    
    span.MuiChip-label {
        padding: 10px;
        font-size: min(6vw, 1.2rem);
        color: #999;
    }
`;