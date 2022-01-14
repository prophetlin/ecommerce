import React from 'react';
import styled from 'styled-components';
import { useHistory } from "react-router-dom";

// genre, keyword tags
export default function Tag(props) {
	const {type, name, outline} = props;
    const history = useHistory();

	const handleClick = () => {
        const data = {
            q: name,
            category: type,
        };

        // on click search tag
        const urlParams = new URLSearchParams(data);
        const urlQuery = "?" + urlParams.toString();
        history.push({
            pathname: '/search',
            search: urlQuery,
            state: {},
        });
	}

	return (
		<Box onClick={handleClick} outline={outline}>
			{name}
		</Box>
	);
}

const Box = styled.div`
    width: auto;
    height: 28px;
    padding: 20px;
    text-align: center;
	background: #3c4caa;
	color: white;
	font-size: 1.25rem;
	border-radius: 30px;
    white-space: nowrap;
    &:hover {
        /*text-decoration-line: underline;*/
        border: 2px solid ${props => props.outline ? props.outline : '#eee'};
        cursor: pointer;
    }
`;