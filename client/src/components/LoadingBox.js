import React from 'react'
import styled from 'styled-components';

// loading screen
export default function LoadingBox() {
    return (
        <Wrap>
            <i className="fas fa-spinner fa-spin"></i> Loading...
        </Wrap>
    );
}

const Wrap = styled.div`
    margin-top: 5rem;
    color:white;
    font-size: 20px;
    
`;