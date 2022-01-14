import React, { useState, useEffect } from 'react'
import styled from 'styled-components';
import Poster from '../components/Poster';
import Category from '../components/Category';
import LoadingBox from '../components/LoadingBox';
import API from '../api';
import {
  BrowserRouter as Router,
  Link,
  useLocation,
  useHistory
} from "react-router-dom";

export default function SearchScreen() {
    let api = new API();
    const location = useLocation();
    const history = useHistory();
    const maxPosters = 20;
    const [category, setCategory] = useState(undefined);
    const [query, setQuery] = useState(undefined);
    const [result, setResult] = useState(undefined);
    const [posters, setPosters] = useState([]);
    const [page, setPage] = useState(0);
    const [dropDown, setDropDown] = useState(false);

    //sort form
    const [sortBy, setSortBy] = useState(undefined);
    const [sortOrder, setSortOrder] = useState(undefined);
    
    //fetch results from backend on change of search params
    useEffect(() => {
        let urlParams = new URLSearchParams(location.search);

        const newQ = urlParams.get('q');
        const newCat = urlParams.get('category');
        const newPage = parseInt(urlParams.get('page'));
        const newSortBy = urlParams.get('sort_by');
        const newOrder = urlParams.get('order');

        // if not q or category direct to home
        if (!newQ || !newCat) {
            history.push('/');
            return;
        }

        // if q and cat not changed but sort or page has
        if (newQ === query && newCat === category) {
            // set page, default 0
            if (!isNaN(newPage)) setPage(newPage);
            else setPage(0);
            // set sort by, default relevance
            if (newSortBy) setSortBy(newSortBy);
            else setSortBy('relevance');
            // set order, default descending
            if (newOrder) setSortOrder(newOrder);
            else setSortOrder('desc');
            return;
        }

        api.getJSON(`search${location.search}`)
            .then(r => {
                console.log(r)
                r.movies = r.movies.map((m, i) => ({...m, relevance: -i}))
                setResult(r);
                setQuery(newQ);
                setCategory(newCat);
                // set page, default 0
                if (!isNaN(newPage)) setPage(newPage);
                else setPage(0);
                // set sort by, default relevance
                if (newSortBy) setSortBy(newSortBy);
                else setSortBy('relevance');
                // set order, default descending
                if (newOrder) setSortOrder(newOrder);
                else setSortOrder('desc');

            }).catch((err) => console.log(err['message']));
      }, [location]);


    //handle sort
    useEffect(() => {
        // return if sort category or order not specified
        if (!sortBy || !sortOrder) return;

        if (sortBy === "title") result.movies.sort(compareTitle);
        else if (sortBy === "rating") result.movies.sort(compareRating);
        else if (sortBy === "date") result.movies.sort(compareDate);
        else if (sortBy === 'relevance') result.movies.sort(compareRelevance);
        if (sortOrder !== 'asc') result.movies.reverse();

        setResult({...result});
      }, [sortBy, sortOrder]);

    // create category containing movie posters
    const makePosters = (result, page) => {
        // page should be zero indexed
        let start = Math.min(page*maxPosters, result.movies.length);
        let posters = result.movies.slice(start, start+maxPosters).map(movie => 
                <Poster 
                    key={movie.id}
                    id={movie.id}
                    src={movie.url} 
                    value={movie.rating}
                    title={movie.title}
                    date={movie.releaseDate}
                />
            );
        return (<Category title={result.category} items={posters} keys={result.keys}/>);
    };


    const compareTitle = (a, b) => {
        if ( a.title < b.title ){
            return -1;
        }
        if ( a.title > b.title ){
            return 1;
        }
            return 0;
    };

    const compareRating = (a, b) => {
        return a.rating - b.rating;
    };

    const compareDate = (a, b) => {
        return new Date(a.releaseDate) - new Date(b.releaseDate);
    }

    const compareRelevance = (a, b) => {
        return a.relevance - b.relevance;
    }

    const handleSortChange = (e) => {
        let urlParams = new URLSearchParams(location.search);
        if (e.target.value === 'ascending') urlParams.set('order', 'asc');
        else if (e.target.value === 'descending') urlParams.set('order', 'desc');
        else urlParams.set('sort_by', e.target.value);

        // update url
        history.push({
            pathname: '/search',
            search: '?' + urlParams.toString(),
            state: {},
        })
       
    };
    
    const handlePageChange = (index) => {
        let urlParams = new URLSearchParams(location.search);
        urlParams.set('page', index);

        // update url
        history.push({
            pathname: '/search',
            search: '?' + urlParams.toString(),
            state: {},
        })
    };

    // display loading screen while fetching results
    if (!result) return (<Screen><LoadingBox /></Screen>);

    return(
        <Screen>
            <SortBox>
                <Sort dropDown={dropDown} >
                    <header onClick={() => {setDropDown(!dropDown)}}> Sort <i class="fas fa-sort-amount-down"></i></header>
                    <SortForm dropDown={dropDown}>
                        <Left>
                            <input type="radio" id="relevance" name="category" 
                                    value="relevance" onChange={handleSortChange}
                                    checked={sortBy === 'relevance'}/>
                            <label for="relevance">Relevance</label>
                            <input type="radio" id="title" name="category" 
                                    value="title" onChange={handleSortChange}
                                    checked={sortBy === 'title'}/>
                            <label for="title">Title</label>
                            <input type="radio" id="rating" name="category" 
                                    value="rating" onChange={handleSortChange}
                                    checked={sortBy === 'rating'}/>
                            <label for="rating">Rating</label>
                            <input type="radio" id="date" name="category" 
                                    value="date" onChange={handleSortChange}
                                    checked={sortBy === 'date'}/>
                            <label for="date">Date</label>
                        </Left>
                        <div />
                        <Right>
                            <input type="radio" id="ascending" name="order" 
                                value="ascending" onChange={handleSortChange}
                                checked={sortOrder === 'asc'}/>
                            <label for="ascending">Ascending</label>
                            <input type="radio" id="descending" name="order" 
                                    value="descending" onChange={handleSortChange}
                                    checked={sortOrder !== 'asc'}/>
                            <label for="descending">Descending</label>
                        </Right>
                    </SortForm>
                </Sort>
                </SortBox>
            <CategoryContainer>
                {makePosters(result, page)}
            </CategoryContainer>
            <PageNav page={page} setPageIndex={handlePageChange} numItems={result.movies.length} maxItems={maxPosters} />
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

const SortBox = styled.section`
    width: min(80vw, 850px);

`;

const Sort = styled.section`
    width: 100%;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid ${props => props.dropDown ? 'white' : '#555'};
    margin-top: 10px;
    color: #ccc;
    font-size: 1.2rem;
    cursor:pointer;
    > header {
        font-weight: 500;
        
        i {
            margin-left: 2px;
        }
    }

    :hover {
        color: white;
        border-color: white;
    }
`;

const SortForm = styled.form`
    width: 100%;
    display: flex;
    transition: height .5s;
    height: ${props => props.dropDown ? '175px' : '0'};
    overflow: hidden;

    > div {
        width: 0;
        height: 97%;
        border-left: 2px solid #555;
        margin: 0 10px;
    }
`;

const Left = styled.section`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    > * {
        margin: 5px 0;
    }
    input[type="radio"] {
        display: none;
    }

    label {
        width: 100%;
        height: 40px;
        cursor:pointer;
        font-size: 1rem;
        font-weight: 500;
        line-height: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    input[type="radio"]:checked+label {
      transition: background-color .5s;
      background-color: #222;
    }


`;

const Right = styled.section`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    > * {
        margin: 5px 0;
    }
    input[type="radio"] {
        display: none;
    }

    label {
        width: 100%;
        height: 40px;
        cursor:pointer;
        font-size: 1rem;
        font-weight: 500;
        line-height: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    input[type="radio"]:checked+label {
      transition: background-color .5s;
      background-color: #222;
    }


`;


function PageNav(props) {
    // page is zero indexed
    const {page, setPageIndex, numItems, maxItems} = props;

    // set max page, curr page, array of page index
    let totalPages = Math.ceil(numItems/maxItems);
    let currPage = Math.min(page, totalPages-1);
    let pageArr = [];
    for (let i = 0; i < 11; i++)
        if (page+(i-5) >= 0 && page+(i-5) < totalPages) 
            pageArr.push(page+(i-5));
    
    const handleClickIndex = (index) => {
        setPageIndex(index);
    }

    const handleClickPrev = () => {
        if (page-1 >= 0) setPageIndex(page-1);
    }

    const handleClickNext = () => {
        if (page+1 < totalPages) setPageIndex(page+1);
    }

    return (
        <PageNavBox>
            <i className="fas fa-chevron-left" onClick={handleClickPrev}></i>
            {pageArr.map(page => <PageNum key={page} onClick={() => {handleClickIndex(page)}}
                                            selected={page === currPage}> {page+1} </PageNum>)}
            <i className="fas fa-chevron-right" onClick={handleClickNext}></i>
        </PageNavBox>
    );

}

const PageNavBox = styled.nav`
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    margin-top: 50px;
    font-size: 1.3rem;
    color: white;
    line-height: 1;

    > * {
        margin: 0 5px;
        cursor:pointer;

    }

    > i {
        margin: 5px 10px 0 10px;
        :hover {
            text-decoration: underline;
        }
    }
`;

const PageNum = styled.section`
    text-decoration: ${props => props.selected ? 'underline' : 'none'};
    :hover {
        text-decoration: underline;
    }
`;