import React from 'react';
import styled from 'styled-components';
import Rating from './Rating';
import { Link } from 'react-router-dom';
import Thumbnail from './Thumbnail';

// Movie poster with title, rating and release date
export default function Poster(props) {
    const {id, src, title, value, date} = props;

    return (
        <PosterWrap>
            <InnerWrap>
                <Thumbnail id={id} src={src} alt={title + ' poster'} width='300'/>
            </InnerWrap>
            <Title>{title}</Title>

            <Info>
                <Rating name="half-rating-read" value={props.value} precision={0.5} readOnly /> 
                <ReleaseDate>{date.split('-')[0]}</ReleaseDate>                
            </Info>
        </PosterWrap> 
    );

}

const PosterWrap = styled.div`
    display: flex;
    flex-direction: column;
    width: 240px;
    
    margin: 3rem;

    @media only screen and (max-width: 1635px) {
        width: 180px;
        
      }
    
`;

const Title = styled.section`
    color: white;
    width: 100%;
    font-size: 1rem;
    margin-top: 5px;
`;

const InnerWrap = styled.div`
    width: 240px;
    height: 350px;
    @media only screen and (max-width: 1635px) {
        width: 180px;
        height: 260px;
      }
`;

const PosterPic = styled.img`
    max-width: 100%;
    max-height: 100%;

`;

const Sspan = styled.div`
    overflow: hidden;
    height:20px;
    margin-bottom:1rem;
`;

const Info = styled.div`
    display:flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 10px;

`;

const ReleaseDate = styled.section`
    position: relative;
    top: -3px;
    font-size: 1rem;
    color: #555;
    margin: 0 10px;
    font-weight: 500;
`;
