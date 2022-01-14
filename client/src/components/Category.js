import React from 'react';
import styled from 'styled-components';

// displays catalogue of items (movie posters) with title heading
export default function Category(props) {
	const {title, items, keys} = props;
    
    return (
        <Container>
            <header> 
                {title}:&nbsp; 
                <Keys>{keys ? keys.sort().join(', ') : undefined}</Keys>
            </header>
            <ItemSection>
                {items.length === 0 ? <span> No Result </span> : items}
            </ItemSection>
        </Container>
    )
}

const Container = styled.section`
    display: flex;
    flex-direction: column;
    
    header {
        color: white;
        font-size: 2rem;;
        font-weight: 500;
    }
    margin-top: 5rem;
    width: 100%;
`;

const ItemSection = styled.section`
    display: flex;
    flex-wrap: wrap;
    width:100%;
    > span {
        font-size: 3rem;
        font-weight: 500;
        color: #333;
        margin: 50px;

    }
`;

const Keys = styled.span`
`;