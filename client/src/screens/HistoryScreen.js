import React from 'react';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import { useHistory } from 'react-router-dom';
import API from '../api';
import * as Session from '../session';
import Category from '../components/Category';
import LoadingBox from '../components/LoadingBox';
import Thumbnail from '../components/Thumbnail';

export default function HistoryScreen() {
    const api = new API();
    const history = useHistory();
    const [cat, setCat] = React.useState([]);
    // fetch purchase history
    React.useEffect(() => {
        api.getJSON("user/purchase", Session.authHeader())
            .then(r => {
                // get current time in seconds since epoch
                const currTime = Math.floor(new Date().getTime() / 1000);
                let newCat = [];
                // add purchases
                let purchase = r.purchase.map(movie => <Item key={movie.movieID} item={movie} />)
                newCat.push(<Category title='Purchased' items={purchase} />)
                
                // add rentals
                let rental = r.rent.filter(movie => movie.endtime > currTime);
                rental = rental.map(movie => <Item key={movie.movieID} item={movie} />)
                newCat.push(<Category title='Rental' items={rental} />)

                setCat([...newCat]);

            }).catch((err) => console.log(err['message']));
      }, []);

    // if user not logged in redirect to home
    if (!Session.getToken()) history.push('/');

	return (
        <Screen>
            {cat.length === 0 ? (<LoadingBox />) : cat.map(rec => <CategoryContainer> {rec} </CategoryContainer>)}
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

const CategoryContainer = styled.section`
    width: 90vw;
`;

// movie item with poster, title, time left on rent and watch button
const Item = (props) => {
    const api = new API();
    const history = useHistory();
    const { item } = props;
    const {movieID, title, url, ptime, endtime} = item;
    // get current time in seconds since epoch
    const currTime = Math.floor(new Date().getTime() / 1000);
    let days = null;
    // calculate time in days till rent expiry if renting movie
    if (endtime && endtime > currTime) {
        days = Math.ceil((endtime - currTime)/(60*60*24));
    }
    

    return (
        <ItemContainer>
            {days ? <Time> {`${days} days left`} </Time> : null}
            <Poster>
                <Thumbnail id={movieID} src={url} alt={title + ' poster'} width='300'/>
            </Poster>
            <header> {title} </header>
            <Button 
                onClick={() => history.push(`/watch/${movieID}`)}
                variant="contained" 
                size="large"
                color="primary"
                fullWidth
                style={{ 
                        fontSize: '1rem',
                        fontWeight: 'bold', 
                        color: 'white', 
                    }}
            >
                Watch
            </Button>

        </ItemContainer>
    );
}


const ItemContainer = styled.section`
    display:flex;
    flex-direction: column;
    color: white;
    width: 200px;
    margin: 3rem;
    > * {
        margin-bottom: 30px;
    }
    header {
        overflow-wrap: anywhere;
        font-size: 1.2rem;
    }
    img {
        width: 200px;
        height: 300px;
    }
`;

const Poster = styled.section`
    width: 200px;
`

const Time = styled.section`
    width: 100%;
    font-size: 1rem;
    font-weight: bold;
    color: green;
    text-align: center:
`;