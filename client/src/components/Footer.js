import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Website footer
export default function Footer() {

    return(
        <Inner>
            <StyledImg src="/images/mflix.jpg" alt="logo"></StyledImg>
            Copyright © 2021 Movieflix inc All right reserved        
                
        </Inner>
    );
}


const StyledImg = styled.img`
    position: relative;
    cursor:pointer;
    height:50px;
    width:50px;
    left:40%;
    padding-bottom:4rem;
`;

const Inner = styled.div`
    text-align: center;
    display:flex;
    flex-direction: column;
    margin-top: 20rem;
    margin-left: auto;
    margin-right: auto;
    width: 30rem;
    font-size: 15px;
    color: white;
`;
