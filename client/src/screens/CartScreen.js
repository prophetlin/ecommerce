import React from 'react';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import { useHistory } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import Thumbnail from '../components/Thumbnail';
import API from '../api';
import * as Session from '../session';

export default function CartScreen() {
    const api = new API();
    const history = useHistory();
    const update = React.useState(false);
    const [change, setChange] = update;
    const [cart, setCart] = React.useState(undefined);
    const [total, setTotal] = React.useState(0);
    const [canCheckout, setCanCheckout] = React.useState(false);

    // fetch movies in user's cart
    React.useEffect(() => {
        api.getJSON('user/cart', Session.authHeader())
            .then(r => {
                console.log(r);
                let newCart = [];
                let sum = 0;
                // create arr of cart items
                for (let i = 0; i < r.cart.length; i += 1) {
                    newCart.push(<Item key={r.cart[i].movieID} item={r.cart[i]} update={update} />)
                    sum += r.cart[i].price;
                }
                setCart([...newCart]);
                setTotal(sum);
                setCanCheckout(newCart.length !== 0);
            }).catch((err) => console.log(err['message']));
    }, [change]);

    const handleCheckout = () => {
        history.push('/payment');
    }

    // if user not logged in redirect to home
    if (!Session.getToken()) history.push('/');

    // display loading screen while fetching results
    if (!cart) return (<Screen><LoadingBox /></Screen>);

	return (
        <Screen>
            <ItemList>
                <header> Cart </header>
                {cart.length === 0 ? <span> No movies in cart. </span>
                    : cart
                }
                {canCheckout && <Total> Total: {`$${total.toFixed(2)}`} </Total>}
                <Checkout>
                {canCheckout && <Button 
                                    onClick={handleCheckout}
                                    variant="contained" 
                                    size="large"
                                    color="primary"
                                    fullWidth
                                    style={{ 
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold', 
                                            color: 'white', 
                                        }}
                                >
                                    Checkout
                                </Button>}
            </Checkout>
            </ItemList>
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

const Checkout = styled.section`

`;

const ItemList = styled.section`
    margin-top: 70px;
    width: min(80vw, 1100px);
    display: flex;
    flex-direction: column;
    align-items: center;
    > * {
        color: white;
        width: 100%;
        margin-bottom: 100px;
    }

    > header {
        font-size: 4rem;
        font-weight: 500;
        text-align: center;
        color: orange;
        margin-bottom: 40px;
    }

    > span {
        font-size: 3rem;
        font-weight: 500;
        color: #333;
        width: 100%;
        text-align: center;

    }
`; 

const Total = styled.section`
    width: 100%;
    color: white;
    font-size: 2.5rem;
    text-align: center;
    
`;

// cart item with movie poster, purchase type, amount and remove option
const Item = (props) => {
    const api = new API();
    const history = useHistory();
    const { item, update } = props;
    const [change, setChange] = update;
    const {movieID, title, url, rent, price} = item;
    const [load, setLoad] = React.useState(false);

    const handleDelete = () => {
        setLoad(true);

        const data = {
            movieID: movieID,
            rent : rent,
            add: false,
        };
        // remove item from user cart
        api.postJSON(`user/cart`, data, Session.authHeader())
            .then(r => {
                Session.DecrementCartNum();
                setChange(!change);
                history.push(`/cart`);
            }).catch((err) => console.log(err['message']));
    }
    
    return (
        <ItemContainer>
            <Poster>
                <Thumbnail id={movieID} src={url} alt={title + ' poster'} width='300'/>
            </Poster>
            <Description>
                <header> {title} </header>
                <span> {rent ? 'Rent':'Buy'} </span>
            </Description>
            <Price>
                {`$${price.toFixed(2)}`}
            </Price>
            <Delete>
                <Button 
                    onClick={handleDelete}
                    variant="contained" 
                    size="large"
                    color="secondary" 
                    fullWidth
                    style={{ 
                            fontSize: '1.2rem',
                            fontWeight: 'bold', 
                            color: 'white', 
                        }}
                >
                    {load ? <i className="fas fa-spinner fa-spin"/> : 'X'}
                </Button>
            </Delete>
        </ItemContainer>
    );
};

const ItemContainer = styled.section`
    width: 100%;
    display: flex;
    
`;

const Poster = styled.section`
    width: 200px;
    margin-right: 100px;
`;

const Description = styled.section`
    width: 400px;
    display: flex;
    flex-direction: column;
    font-size: 1.8rem;
    margin-right: 50px;
    > * {
        margin-bottom: 30px;
    }
`;

const Price = styled.section`
    width: 100px;
    display: flex;
    font-size: 1.8rem;

`;

const Delete = styled.section`
    width: 100px;
    height: 100%;
    margin-left: auto;
`;

