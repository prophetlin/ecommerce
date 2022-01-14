import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import { FormControl, Select, MenuItem, InputLabel } from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import * as Session from '../session';
import API from '../api';

// capitalise first letter of word
const capFirst = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

// capitalise every word in string
const cap = (str) => {
    let words = str.split(' ');
    return words.map(w => capFirst(w)).join(' ');
} 

// get username from email
const getUsername = () => {
    let email = Session.getEmail();
    if (!email) return 'user';

    return capFirst(email.split(/@/)[0]);
}


// for keyword limit number of rendered matches to first hundred to prevent lag
const filterOptions = createFilterOptions({
    limit: 100
  });

export default function Header() {
    
    //api object handles backend call
    let api = new API();
    //handle url change
    const history = useHistory();
    const location = useLocation();

    //userinput
    const [input,setInput] = useState('');
    //drop downmenu
    const [isDropDown, setDropDown] = useState(false);
    const [isMenuDropDown, setMenuDropDown] = useState(false);
    //cart hooks
    const [category, setCategory] = useState("Title");
    const [cartN, setCartN] = useState(0);

    // search options
    const [genres, setGenres] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedKeywords, setSelectedKeywords] = useState([]);

    // fetch movie genres and keywords
    React.useEffect(() => {
        Session.getOptions()
        .then(res =>{
            setGenres(res.genres);
            setKeywords(res.keywords);
        })
        .catch(err => console.log(err['message']))

    },[])

    // set cart number and query params on change of location
    useEffect(() => {
        console.log(location);

        // if logged in
        if (Session.getToken()) {
            if (Session.getCartNum()) {
                setCartN(Session.getCartNum);
            }
            else {
                // retrieve cart data
                api.getJSON(`user/cart`, Session.authHeader())
                    .then(r => {
                        Session.setCartNum(r.cart.length);
                        setCartN(r.cart.length);
                        console.log(r.cart.length);
                    })
            }
        }

        // if search page
        if (location.pathname === '/search') {
            let searchParams = new URLSearchParams(location.search);
            let cat = searchParams.get('category');
            let q = searchParams.get('q');
            setCategory(cat);
            if (cat === 'Title') setInput(q);
            else if (cat === 'Genre') setSelectedGenres(q.split('|').map(g => cap(g)));
            else if (cat === 'Keyword') setSelectedKeywords(q.split('|'));
            else if (cat === 'Overview') setInput(q);
        }

      }, [location]);

    // don't render in admin view
    if (location.pathname === '/admin')
        return null;

    //drop down switches
    const handleDropDown = () => {
        setDropDown(!isDropDown);
    }

    // handle search
    const handleQuery = () => {
        // create query params
        const data = {
            category
        };

        if (category === 'Title') data.q = input;
        else if (category === 'Genre') data.q = selectedGenres.join('|');
        else if (category === 'Keyword') data.q = selectedKeywords.join('|');
        else if (category === 'Overview') data.q = input;

        // if no input do nothing
        if (!data.q) return;
        // validate input
        if (data.q.length > 500) {
            alert("Search query too long.");
            return;
        }

        const urlParams = new URLSearchParams(data);
        const urlQuery = "?" + urlParams.toString();

        console.log(urlQuery);
        history.push({
            pathname: '/search',
            search: urlQuery,
            state: {},
        });
    }
    
    const onSubmit = (e) => {
        // stop auto redirect
        e.preventDefault();

        handleQuery();
    }

    const signIn = <LoginButton                         
                        onClick={() => { history.push('/login'); }}
                   >
                        Sign in
                    </LoginButton>
    
    //admin user icon menu has additional "add movie"
    //logout clears user session
    const userIcon = <UserIcon 
                        onMouseEnter={() => {setMenuDropDown(true)}}
                        onMouseLeave={() => {setMenuDropDown(false)}}>
                         <img src="/images/userIcon.svg" alt='user icon' />
                         <MenuDropDown hide = {isMenuDropDown ? false : true} >
                            <Option onClick={() => history.push('/profile')}> {getUsername()} </Option>
                            <Option onClick={() => history.push('/history')}> My Movies</Option>
                            {Session.isAdmin() && <Option onClick={() => history.push('/create')}> Add Movie</Option>}
                            <Option onClick={() => {Session.clearSession(); window.location.href='/';}}> Logout </Option>
                        </MenuDropDown>
                     </UserIcon>

    const cartIcon = <CartIcon onClick = {() => history.push('/cart')}>
                         <img src="/images/cartIcon.svg" alt='cart icon' />
                         <span> {cartN} </span>
                     </CartIcon>

    return(
        <Bar>
        <Wrapper>
            <Left>
                <Logo 
                    onClick={() => {history.push("/")}} 
                    src="/images/mlogo.png" alt='logo'
                    />
            </Left>
            <Middle>
                <SearchBar>
                    <Form onSubmit={onSubmit} autoComplete="off">
                        <OptionWrap onClick = { handleDropDown }>
                            <CurrentOption>{category}</CurrentOption>

                            <IconWrapper black>                
                                <i className={isDropDown ? "fas fa-chevron-up" : "fas fa-chevron-down"}></i>
                            </IconWrapper>   

                            <DropDown hide = {isDropDown ? false : true}>
                                <Option onClick={() => setCategory("Title")}>Title</Option>
                                <Option onClick={() => setCategory("Genre")}>Genre</Option>
                                <Option onClick={() => setCategory("Keyword")}>Keyword</Option>
                                <Option onClick={() => setCategory("Overview")}>Overview</Option>
                            </DropDown>

                        </OptionWrap>
                        <Label>
                            {category === 'Title' && <input 
                                                        value={input}
                                                        onChange = {(e)=>{setInput(e.target.value)}}
                                                        type="text" 
                                                        id="query"
                                                        name="query"
                                                        placeholder="Search.."
                                                    />}
                            {category === 'Genre' && <section>
                                                        <Autocomplete
                                                            fullWidth
                                                            multiple
                                                            id="tags-standard"
                                                            options={genres}
                                                            getOptionLabel={(option) => option}
                                                            renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Search.."
                                                                variant="standard"
                                                                InputProps={{...params.InputProps, disableUnderline: true}}
                                                                
                                                            />
                                                            )}
                                                            value={selectedGenres}
                                                            onChange={(event, value) => setSelectedGenres(value)}
                                                        />
                                                        </section>}
                            {category === 'Keyword' && <section>
                                                        <Autocomplete
                                                            filterOptions={filterOptions}
                                                            multiple
                                                            id="tags-standard"
                                                            options={keywords}
                                                            getOptionLabel={(option) => option}
                                                            renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Search.."
                                                                variant="standard"
                                                                InputProps={{...params.InputProps, disableUnderline: true}}

                                                            />
                                                            )}
                                                            value={selectedKeywords}
                                                            onChange={(event, value) => setSelectedKeywords(value)}
                                                        />
                                                        </section>}
                            {category === 'Overview' && <input 
                                                            value={input}
                                                            onChange = {(e)=>{setInput(e.target.value)}}
                                                            type="text" 
                                                            id="query"
                                                            name="query"
                                                            placeholder="Search.."
                                                        />}
                        </Label>
                        <SearchButton type="submit">
                            <i className="fas fa-search fa-2x"></i>
                        </SearchButton>

                    </Form>
                </SearchBar>
            </Middle>
            <Right>
                {Session.getToken() ? cartIcon : <div />}
                {Session.getToken() ? userIcon : signIn}
                
            </Right>

        </Wrapper>
        {Session.isAdmin() && 
            <Admin>
                <Button 
                    onClick={() => {history.push('/admin')}}
                    variant="contained" 
                    size="large" 
                    color="secondary"
                >
                    admin view
                </Button>
            </Admin>
        }
        </Bar>
    );
}

const Bar = styled.nav`
    width: 100vw;
`;

const Admin = styled.section`
    width: 100%;
    color: red;
    font-weight: bold;
    font-size: 2rem;
    text-align: center;

`;

const Wrapper = styled.section`
    display:flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    height: 80px;
    /*border: 1px solid red;*/
    * {
        /*border: 1px solid red !important;*/

    }
`;

const Left = styled.section`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    @media (max-width: 1100px) {
       flex: 0;
    }
    
`;

const Right = styled.section`
    flex: 1;
    height: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;

`;

const Middle = styled.section`
    flex: 4;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;

`;

const Logo = styled.img`
    width:80%;
    :hover {
        background: #333;
    }
`;

const SearchBar = styled.div`
    position: relative;
    z-index: 1;
    width: 80%;
    display: flex;
    background: white;
    padding: 5px 20px;
    border-radius: 30px;
    margin-top: 15px;
`;

const Form = styled.form`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    > * {
        margin: 0 5px;
    }
`;

const SearchButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    outline: inherit;
    i:hover {
        color: #aaa;
    }
`;


const OptionWrap = styled.div`
    display:flex;
    justify-content: space-around;
    align-items: center;
    border-radius: 5px;
    padding: 10px 5px;
    > * {
        margin: 0 5px;
    }
    &:hover{
        background-color: grey;
    }
    transition: all .5s;
`;

const DropDown = styled.div`
    z-index: 5;
    background-color: white;
    display: ${props => props.hide ? "none" : "unset" };
    position: absolute;
    min-width:120px;
    cursor: pointer;
    top: 55px;
    border-radius: 5px;
    overflow: hidden;
`;

const MenuDropDown = styled.div`
    z-index: 1;
    background-color: white;
    display: ${props => props.hide ? "none" : "unset" };
    position:absolute;
    width:120px;
    cursor:pointer;
    top: 70px;
    border-radius: 5px;
    overflow: hidden;
`;

const Option = styled.div`
    color:black;
    display: block;
    padding: 1rem;
    font-weight:bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover{
        background-color: grey;
    }

`;

const CurrentOption = styled.div`
    margin-bottom: 2px;
    color:black;
    font-weight:bold;
    line-height: 1;
`;

const IconWrapper = styled.span`
    color: ${props => props.black ? "black" : "white"};
    cursor:pointer;

`;

const Label = styled.label`

    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    > input {
        border: none;
        outline: none;
        width: 100%;
        font-size: 1.2rem;
    }

    > section {
        width: 100%;

    }
    
`;

const StyledInput = styled.input`
    width: auto;
    
    font-size: 1.2rem;
    @media (max-width: 1317px) {
        width: 300px;
    }
    @media (max-width: 800px) {
        width: 200px;
    }
`;


const UserIcon = styled.section`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    
    
    img:hover {
        filter: invert(0.8);
    }

    img {
        filter: invert(1);
        width: 50px;
        height: 50px;
        margin-right: 30px;
        margin-left: 20px;
        
    }

    @media (max-width: 1860px) {
       margin-right: 40px;
    }

`;

const CartIcon = styled.section`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 100%;
    :hover {
        background: #333;
        span {
            background: #333;
        }
    }
    
    img {
        filter: invert(1);
        width: 60px;
        height: 60px;
        position: relative;
        left: 10px;
        top: -2px;
    }

    span {
        background-color: black;
        height: 30px;
        font-size: 1.9rem;
        font-weight: bold;
        color: orange;
        position: relative;
        left: -28px;
        top: -15px;
    }

`;

const LoginButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    outline: inherit;
    font-size: min(5vw, 1.5rem);
    font-weight: bold;
    color: white;
    &:hover {
      text-decoration-line: underline;
      text-decoration-thickness: 2px;
    }

    @media (max-width: 1000px) {
       margin-right: 20px;
    }
`;