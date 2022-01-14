import React from 'react';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import { useHistory } from 'react-router-dom';
import API from '../api';
import * as Session from '../session';

export default function PaymentScreen() {
    const api = new API();
    const history = useHistory();
    const [total, setTotal] = React.useState(0);
    const [cardNo, setCardNo] = React.useState('');
    const [cvv, setCVV] = React.useState('');
    const [expDate, setExpDate] = React.useState('');

    // fetch user cart
    React.useEffect(() => {
        api.getJSON('user/cart', Session.authHeader())
            .then(r => {
                console.log(r);
                // if cart empty redirect to cart page
                if (r.cart.length === 0) history.push('/cart');
                let sum = 0;
                for (let i = 0; i < r.cart.length; i += 1) {
                    sum += r.cart[i].price;
                }
                setTotal(sum);
            }).catch((err) => console.log(err['message']));
    }, []);

    const onSubmit = (e) => {
        // stop auto redirect
        e.preventDefault();

        // validate credit card no
        if (!/([0-9]{4}\s?){4}/.test(cardNo)) {
            alert("Invalid card number.")
            return;
        }
        // validate date
        if (!/[0-9]{2}\/[0-9]{2}/.test(expDate)) {
            alert("Invalid date.")
            return;
        }
        const parse = expDate.split('/');
        const mth = parseInt(parse[0]);
        const yr =  parseInt('20' + parse[1]);
        if (mth < 1 || mth > 12) {
            alert("Invalid date of expire.");
            return;
        }
        if (new Date(yr, mth) < new Date()) {
            alert("Your card has expired");
            return;
        }
        // validate cvv
        if (!/[0-9]{3}/.test(cvv)) {
            alert("Invalid cvv.");
            return;
        }

        const data = {
            cardNo,
            expDate,
            cvv
        }

        // send purchase confirmation
        api.postJSON('user/purchase', data, Session.authHeader())
            .then(r => {
                Session.setCartNum(0);
                history.push('/history');
            }).catch((err) => alert(err['message']));
    };

    // if user not logged in redirect to home
    if (!Session.getToken()) history.push('/');

	return (
        <Screen>
            <Form onSubmit={onSubmit} autoComplete="off">
                <Header>Total: {`$${total.toFixed(2)}`}</Header>
                <Label htmlFor="cardNo">
                  <span>Card Number:</span>
                  <input
                      type="text"
                      id="cardNo"
                      name="cardNo"
                      placeholder="1234 5678 9123 4567"
                      value={cardNo}
                      onChange={(e) => setCardNo(e.target.value)}
                  />
                </Label>
                <SubSection>
                    <div>
                      <Label htmlFor="exp">
                      <span>Expiry Date:</span>
                      <input
                          type="text"
                          id="exp"
                          name="exp"
                          placeholder="01 / 21"
                          value={expDate}
                          onChange={(e) => setExpDate(e.target.value)}
                      />
                      </Label>
                    </div>
                    <div>
                        <Label htmlFor="cvv">
                          <span>Security Code:</span>
                          <input
                              type="password"
                              id="cvv"
                              name="cvv"
                              placeholder="CVV"
                              value={cvv}
                              onChange={(e) => setCVV(e.target.value)}
                          />
                        </Label>
                    </div>
                </SubSection>
                <Button 
                    type="submit"
                    variant="contained" 
                    size="large" 
                    style={{ backgroundColor: 'white' }}
                >
                    Submit
                </Button>
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

const SubSection = styled.section`
    display:flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    > div {
        width: 40%;
    }
`;

const Form = styled.form`
    margin-top: 150px;
    border: none;
    width: min(80vw, 650px);
    min-height: 500px;
    display: flex;
    flex-direction: column;
    
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
    width: 100%;
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