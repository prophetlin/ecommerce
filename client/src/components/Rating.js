import React from 'react';
import styled from 'styled-components';
import MatRating from '@material-ui/lab/Rating';

// styled rating component
export default function Rating(props) {
	return <RatingWrap><MatRating {...props} /></RatingWrap>;
}

const RatingWrap = styled.div`
    .MuiRating-iconEmpty {
        color: #222;
    }
`;