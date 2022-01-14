import React, { useState, useEffect } from 'react';
import { useHistory, useParams, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import LoadingBox from '../components/LoadingBox';
import Box  from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Rating from '../components/Rating';
import Tag from '../components/Tag'
import API from '../api';
import * as Session from '../session';
import ISO6391 from 'iso-639-1';

export default function MovieScreen() {

    let api = new API();
    const history = useHistory();
    const location = useLocation();
    //this movie's id
    const { id } = useParams();
    //is the movie params initialised yet ?
    const [result, setResult] = useState(undefined);
    //confirm buying modal
    const [open, setOpen] = useState(false);
    const [buying, setBuying]= useState(false);
    //can we watch it ?
    const [watch, setWatch] = useState(false);
    //is in cart?
    const [cart, setCart] = useState(false);
    const [numRatings, setNumRatings] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [promoted, setPromoted] = useState(false);

    //initialise movie page params
    useEffect(() => {
        // console.log(location);
        setResult(undefined);
        api.getJSON(`movie/${id}`, Session.authHeader())
            .then(res=>{
                setResult(res);
                setWatch(res.purchased || res.rented);
                setCart(res.inCartRent || res.inCartPurchase);
                setNumRatings(res.numRating);
                setAvgRating(Number(res.rating));
                setPromoted(res.ispromoted);
            }).catch((err) => console.log(err['message']));
      }, [id]);
      
    const handleBuy = () =>{
        setOpen(true);
        setBuying(true);
    };

    const handleRent = () =>{
        setOpen(true);
        setBuying(false);
    };

    // close purchase confirmation pop up
    const handleClose = () => {
        setOpen(false);
    };

    const handleAddCart = () => {
        // redirect to login if user not logged in
        if (!Session.getToken()) {
            history.push('/login');
            return;
        }

        const data = {
            movieID: id,
            rent : !buying,
            add: true,
        };

        //call backend api to adds movie to cart
        api.postJSON(`user/cart`, data, Session.authHeader())
            .then(r => {
                Session.IncrementCartNum();
                setCart(true);
                history.push(`/movie/${id}`);
            }).catch((err) => console.log(err['message']));

        setOpen(false);
    };

    //admin only, promotes movie on homepage
    const handlePromote = () => {
        const data = {
            'movieID': id,
            'promote': !promoted,
        }
        // send promote or unpromote request
        api.postJSON('user/admin/promote', data, Session.authHeader())
            .then(r => {
                setPromoted(!promoted);
            }).catch((err) => console.log(err['message']));
            
    }

    let button = undefined;
    // display cart button if movie already in cart
    if (cart) button = <CButton onClick={() => {history.push('/cart')}}> In Cart </CButton>;
    // display watch button if movie purchased or rented
    else if (watch) button = <Mbutton 
                                onClick={() => history.push(`/watch/${id}`)}
                                fullWidth
                                variant="contained" 
                                color="primary">Watch</Mbutton>;
    // display buy or rent buttons
    else button = [<Mbutton 
                        onClick={handleBuy}
                        variant="contained" 
                        color="primary">Buy</Mbutton>,
                    <Mbutton 
                        onClick={handleRent}
                        variant="contained" 
                        color="primary">Rent</Mbutton>];

    let adminButton = undefined;
    // display edit, promote buttons for admin
    if (Session.isAdmin()) 
        adminButton = [<Mbutton 
                        onClick={() => {history.push(`/edit/${id}`)}}
                        variant="contained" 
                        color="secondary">Edit</Mbutton>,
                        <Mbutton 
                        onClick={handlePromote}
                        variant="contained" 
                        color="secondary">{promoted ? 'unpromote' : 'promote'}</Mbutton>];

    // don't render page if movie data has yet to be retreived
    if (!result) return (<Screen>(<LoadingBox /></Screen>);
        
    return (
        <Wrap>
            <Left>
                <Title>{result.title}</Title>
                <ButtonWrap>
                    {adminButton}
                </ButtonWrap>
                <PosterWrap>                            
                    <PosterPic src={result.url} alt="cat"></PosterPic>
                </PosterWrap>

                <ButtonWrap>
                    {button}                         
                </ButtonWrap>

                <RatingWrap>
                    <Msg>Rating:</Msg>
                    {(numRatings > 0) && <AllRating>                                 
                                            <Rating name="half-rating-read" value={avgRating} precision={0.5} readOnly size="large"/>  
                                            <NumRating>({numRatings})</NumRating>
                                        </AllRating>}
                    
                    {Session.getToken() && <RatingForm 
                        movieID={id} 
                        avgRating={[avgRating, setAvgRating]}
                        numRatings={[numRatings, setNumRatings]} 
                        userRating={Number(result.userRating)}
                    />}

                </RatingWrap>
                <Dialog
                    open={open}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"Confirm Purchase"}</DialogTitle>
                    <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {buying ? `Confirm buying ${result.title} for $${result.purchaseprice} ?` : `Confirm renting ${result.title} for 2 weeks at $${result.rentprice} ?`}
                    </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleAddCart} color="primary" autoFocus>
                        Add to Cart
                    </Button>
                    </DialogActions>
                </Dialog>
            </Left>
            
            <Right>
                <Minfo>
                    <Stitle>Overview</Stitle>
                    <Overview>
                        {result.overview}
                    </Overview>
                </Minfo>
                <Minfo>
                    <Stitle>MPAA: {result.adult}</Stitle>
                </Minfo>
                <Minfo>
                    <Stitle>Runtime: {result.runtime} min</Stitle>
                </Minfo>
                <Minfo>
                    <Stitle>Language: {ISO6391.getName(result.language)}</Stitle>
                </Minfo>
                <Minfo>
                    <Stitle>Release Date:  {result.release_date}</Stitle>
                </Minfo>
                <Minfo>
                    <Stitle>Genre: </Stitle>
                    <Mitems>
                        {result.genres.map(genre=> <Tag type="Genre" name={genre}/>)}
                    </Mitems>
                
                </Minfo>
                <Minfo>
                    <Stitle>Keywords: </Stitle>
                    <Mitems>
                        {result.keywords.map(keyword=> <Tag type="Keyword" name={keyword}/>)}
                    </Mitems>
                
                </Minfo>
            </Right>
        
        </Wrap>        
    );
}

//rating form component
const RatingForm = (props) => {
    const api = new API();
    const {movieID, avgRating, numRatings, userRating} = props;
    const [N, setN] = numRatings;
    const [avg, setAvg] = avgRating;
    const [inp, setInp] = useState(userRating > -1);
    const [load, setLoad] = useState(false);
    const [rating, setRating] = useState(userRating > -1 ? userRating : 0);
    const [able, setAble] = useState(true);
    const button = <Button 
                        onClick={() => {setInp(true)}}
                        variant="contained"  
                        color="primary"
                    >
                       Rate this movie
                    </Button>;

    //handle user click on start to rate
    const handleRate = (e) => {
        const val = Number(e.target.value);
        const prevRating = rating;
        setRating(val);
        setAble(false);
        setLoad(true);
        const data = {
            'movieID': movieID,
            'rating' : val
        }

        // submit rating
        api.postJSON('user/rate', data, Session.authHeader())
            .then(r => {
                setAble(true);
                setLoad(false);
                // if average rating used
                // if (!prevRating) { 
                //     setAvg((avg*N+val)/(N+1));
                //     setN(N+1);
                // } else {
                //     setAvg((avg*N-prevRating+val)/N);
                // }
            }).catch((err) => console.log(err['message']));
    }

    return (
        <div>
            {!inp ? button : 
                <RatingContainer>
                    <Msg>Your Rating:</Msg>
                    <section>
                        <Rating 
                            value={rating}
                            onChange={(event, newValue) => {
                                handleRate(event);
                            }}
                            name="half-rating" 
                            disabled={!able}
                            precision={0.5}
                            size="large"
                        />
                        <span>{load && <i className="fas fa-spinner fa-spin"></i>}</span>
                    </section>
                </RatingContainer>
            }
        </div>
    );
};

const Screen = styled.section`
    border: none;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const RatingContainer = styled.section`
    section {
        display: flex;
        align-items: center;
        > span {
            margin-left: 10px;
            height: 25px;
        }
    }
`;

const Title = styled.span`
    Font-weight:bold,
    color:white;
    font-size:30px;
`;


const Left = styled.div`
    display:flex;
    flex-direction: column;
    @media (max-width: 800px) {
        margin-bottom: 3rem;
    }
`;

const Right = styled.div`

    display:flex;
    flex-direction: column;
    margin-left:10rem;
    @media (max-width: 800px) {
        margin-left: 0;
    }
`;

const Wrap = styled.div`
    margin: auto;
    width: 70%;
    display:flex;
    justify-content: center;
    padding:5rem;
    color:white;
    @media (max-width: 800px) {
        flex-direction: column;
    }

`;

const PosterWrap = styled.div`
    margin-top: 2rem;
    width: 100%;

`;

const PosterPic = styled.img`
    width: 320px;

`;

const ButtonWrap = styled.div`
    display:flex;
    justify-content: space-between;
    margin-top: 1rem;
    width: 320px;
    > span {
        color: orange;
        width: 100%;
        font-size: 2rem;
        font-weight: 500;
        text-align: center;
    }

`;

const Mbutton = styled(Button)`
    width: 150px;
    &&:disabled {
        opacity: 0.5;
        background: #3f51b5;
        color: white;
    }
`;

const RatingWrap = styled.div`
    padding-top: 3rem;
    > * {
        margin: 20px 0;
    }
`;

const Msg = styled.div`
    margin-bottom: 0.5rem;
    font-size 18px;
    color:white;

`;

const Stitle = styled.div`
    font-size 25px;
`;

const Mbox = styled(Box)`
    font-size 15px;
    margin-left: 1rem;
    margin-top: 1rem;
    display:inline;

`;

const Mitems = styled.div`
    margin-top: 2rem;
    display: flex;
    > * {
        margin: 0 10px 20px 0;
    }
    flex-wrap: wrap;
`;

const Minfo = styled.div`
    
    margin-top: 3rem;

`;

const Overview = styled.section`
    color:white;
    resize: none;
    font-size 20px;
    background-color:black;
    width:100%;
    min-height:300px;
    border:none;
    margin-top: 10px;
    @media (max-width: 1317px) {
        width:300px;
    }
`;

const AllRating = styled.div`
    margin: 0;
    display: flex;
    align-items: center;
    color: white;
    font-size: 20px;
    line-height: 1;
    .MuiRating-iconEmpty {
        color: #222;
    }
`;

const NumRating = styled.section`
    margin: 0 20px;
    position: relative;
    top: -1px;
`;

const CButton = styled.button`
    color: orange;
    width: 100%;
    font-size: 2rem;
    font-weight: 500;
    text-align: center;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    outline: inherit;
    &:hover {
      text-decoration-line: underline;
      text-decoration-thickness: 3px;
    }
`;
