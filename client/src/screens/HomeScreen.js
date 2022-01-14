import React, { useState, useEffect } from 'react'
import styled from 'styled-components';
import Poster from '../components/Poster';
import Category from '../components/Category';
import LoadingBox from '../components/LoadingBox';
import API from '../api';
import * as Session from '../session';

export default function HomeScreen() {
    let api = new API();
    const [recs, setrecs] = useState([]);
    // get recommendations
    useEffect(() => {
        api.getJSON("user/rec", Session.authHeader())
            .then(r => {
                let newRecs = r.recs.filter(rec => rec.movies.length !== 0);
                // create list of categories and their recommended movies
                newRecs = newRecs.map(rec => {
                    let items = rec.movies.map(movie => 
                        <Poster 
                            key={movie.id}
                            id={movie.id}
                            src={movie.url} 
                            value={movie.rating}
                            title={movie.title}
                            date={movie.releaseDate}
                        />
                    );
                    return (<Category title={rec.category} items={items} />);
                });
                setrecs([...newRecs]);

            }).catch((err) => console.log(err.message));
      }, []);

    
    return(
        <Screen>
            {recs.length === 0 ? (<LoadingBox />) : recs.map(rec => <CategoryContainer> {rec} </CategoryContainer>)}

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
    width:90vw;
`;

const MovieSection = styled.div`
    margin: auto;
    width:100%;
`;