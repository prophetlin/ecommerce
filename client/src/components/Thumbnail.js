import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

// display poster thumbnails
export default function Thumbnail(props) {
    const {id, src, alt, width} = props;

    // reduce requested poster size to speed up image retrievel
    if (width && src.includes("https://image.tmdb.org/t/p/")) {
        src.replace('original', `w${width}`);
    }

	return (
		<Link to = {`/movie/${id}`}>
            <Img src={src} alt={alt} />
        </Link>	
	);
}

const Img = styled.img`
	width: 100%;
    height:100%;
    object-fit: cover;
    overflow: hidden;
    :hover {
        box-shadow: 1px 1px 10px 5px #ccc;
    }
`;