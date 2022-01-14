import React from 'react';
import styled from 'styled-components';
import TextField from '@material-ui/core/TextField';
import { FormControl, Select, MenuItem, InputLabel } from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import { DataGrid } from '@material-ui/data-grid';
import Button from '@material-ui/core/Button';
import { useHistory } from 'react-router-dom';
import Thumbnail from '../components/Thumbnail';
import Rating from '@material-ui/lab/Rating';
import API from '../api';
import * as Session from '../session';
import ISO6391 from 'iso-639-1';

// for title limit number of rendered matches to first hundred to prevent lag
const filterOptions = createFilterOptions({
    limit: 100
  });

export default function AdminScreen(props) {
    const api = new API();
    const history = useHistory();
    const [title, setTitle] = React.useState([]);
    const [selectTitle, setSelectTitle] = React.useState('');
    const [go, setGo] = React.useState(false);

    // fetch movie titles
    React.useEffect(() => {
         api.getJSON(`user/admin/movie`, Session.authHeader())
             .then(res=>{
                 setTitle(res);
             }).catch((err) => console.log(err['message']));

        if (Session.getAdminData()) {
            setSelectTitle(Session.getAdminData());
            setGo(!go);
        }
    },[])

    // get overall sales data if not individual movie selected
    React.useEffect(() => {
        console.log(selectTitle)
         if (selectTitle === null) {
            Session.setAdminData('');
            setGo(!go);
        }
    },[selectTitle])

    // switch to user view
    const handleUserView = () => {
        if (selectTitle) Session.setAdminData(selectTitle);
        history.push('/');
    }
    
    // if user not admin redirect to home
    if (!Session.isAdmin()) history.push('/');

	return (
		<Screen>
            <Header> 
                <LogoutButton                         
                        onClick={() => {Session.clearSession(); window.location.href='/';}}>
                       Logout
                </LogoutButton>
                <span> Admin </span>
                <SwitchButton>
                    <Button 
                        onClick={handleUserView}
                        variant="contained" 
                        size="large" 
                        color="secondary"
                    >
                        user view
                    </Button>
                </SwitchButton>
            </Header>
            <Control>
                <SearchLabel>
                    <span> Movie: </span>
                    <section>
                        <Autocomplete
                            filterOptions={filterOptions}
                            id="tags-standard"
                            options={title}
                            getOptionLabel={(option) => option}
                            renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="standard"
                            />
                            )}
                            value={selectTitle}
                            onChange={(event, value) => setSelectTitle(value)}

                        />
                    </section>
                    <Button 
                        onClick={() => {setGo(!go)}}
                        variant="contained" 
                        size="large" 
                        color="primary"
                    >
                        go
                    </Button>
                </SearchLabel>
                <Button 
                    variant="contained" 
                    size="large" 
                    color="secondary"
                    onClick={() => {history.push(`/create`)}}
                >
                    add movie
                </Button>
            </Control>
            <View>
                <Movie title={selectTitle} go={go} />
                <Sale title={selectTitle} go={go} />
            </View>
		</Screen>
	);	
}

const Screen = styled.section`
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100vw;
    height:100vh;
    background: #eee;
    overflow: scroll;
    
`;

const Header = styled.section`
    width: 100%;
    color: red;
    font-weight: bold;
    font-size: 2rem;
    text-align: center;
    position: relative;
    padding: 8px 0;

`;

const SwitchButton = styled.section`
    position: absolute;
    top: 5px;
    right: 15px;
`;

const LogoutButton = styled.button`
    position: absolute;
    top: 10px;
    left: 15px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    outline: inherit;
    font-size: 1.5rem;
    font-weight: bold;
    color: #aaa;
    &:hover {
      text-decoration-line: underline;
      text-decoration-thickness: 3px;
    }
`

const Control = styled.section`
    margin-top: 100px;
    padding: 30px;
    border-radius: 25px;
    width: min(80vw, 800px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;


`;

const View = styled.section`
    margin-top: 50px;
    padding: 30px;
    border-radius: 25px;
    width: min(80vw, 800px);
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
`;

const SearchLabel = styled.label`
    display: flex;
    width: 50%;
    > span {
        font-size: 1.5rem;
        font-weight: 500;
        margin-right: 20px;
    }

    > section {
        flex: 1;
        margin-right: 20px;
    }

    input {
        font-size: 1.2rem;
    }
`;

// sales table
function Sale(props) {
    const {title, go} = props;
    const api = new API();
    const history = useHistory();
    const [type, setType] = React.useState('Purchases');
    const typeOptions = ['Purchases', 'Rentals'];
    const [time, setTime] = React.useState('Past Week');
    const timeOptions = ['Past Week', 'Past Month', 'Past Year', 'All Time'];
    const [update, setUpdate] = React.useState(false);
    const [salesData, setSalesData] = React.useState({});

     // fetch sales data on init or change of form
     React.useEffect(() => {
         fetchData();
     }, [go, update]);

    // fetch sales data
    const fetchData = () => {
        const path = (typeOptions[0] === type) ? 'purchase':'rent';
        let seconds = 60 * 60 * 24;
        if (time === timeOptions[0]) seconds = seconds * 7;
        else if (time === timeOptions[1]) seconds = seconds * 31;
        else if (time === timeOptions[2]) seconds = seconds * 365;
        else if (time === timeOptions[3]) seconds = seconds * 365 * 20;
        
        // get current time in seconds since epoch
        const currTime = Math.floor(new Date().getTime() / 1000);
        // construct url query
        const query = {
            start: currTime - seconds,
            end: currTime,
            ...(title ? {title} : {})
        }
        const queryStr = new URLSearchParams(query).toString();
        console.log(`${path}?${queryStr}`);
        // fetch data
        api.getJSON(`user/admin/sales/${path}?${queryStr}`, Session.authHeader())
            .then((r) => {
                console.log(r);
                setSalesData({...r, title});
            })
            .catch((err) => console.log(err.message));
    };

    return (
        
            <Section>
                <FormContainer>
                    <Label htmlFor="select-type">                      
                        <Options
                            
                            labelId="type-label"
                            id="select-type"
                            value={type}
                            onChange={(e) => {setType(e.target.value); setUpdate(!update);}}
                            range={typeOptions}
                        />
                    </Label>
                   
                    <Label htmlFor="select-time">
                        <Options
                            
                            labelId="time-label"
                            id="select-time"
                            value={time}
                            onChange={(e) => {setTime(e.target.value); setUpdate(!update);}}
                            range={timeOptions}
                        />
                    </Label>

                </FormContainer>
                <Table data={salesData} rent={!(typeOptions[0] === type)}/>
            </Section>
            
    );
}

const Section = styled.section`
    width: 100%;
   
`;

const FormContainer = styled.section`
    display: flex;
    width: 100%;
    align-items: baseline;
    font-weight: normal;
    font-size: 1.3rem;
    > span {
        margin: 0 20px;
    }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  margin: 20px 20px 20px 0;
  
  span {
    margin: 10px;
    font-size: min(6vw, 1em);
    font-weight: bold;
  }
`;

// sales table select options
const Options = (props) => {
  const {
    labelName, labelId, id, value, onChange, range,
  } = props;
  return (
    <FormControl variant="outlined">
      <Select
        labelId={labelId}
        id={id}
        value={value}
        onChange={onChange}
      >
        {range.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
      </Select>
    </FormControl>
  );
};

// Table of results
const Table = (props) => {
  const { title, data, rent } = props;

  // empty data
  if (!data['result']) data['result'] = [];

  let rows = [];
  let columns = [];
  
  // If no title given then display aggregate movie sales
  if (!data.title) {
      // create Movie:Sales data
      const res = {};
      const id = {};
      for (let i = 0; i < data.result.length; i++) {
          let title = data.result[i].movieTitle;
          res[title] = (res[title] || 0) + 1; 
          id[title] = data.result[i].movieID;
      }
      
      // create rows
      rows = Object.keys(res).map((k, i) => {
          const row = {
              id: id[k],
              title: k,
              sales: res[k],
          }
          return row;
      });

      columns = [
        { field: 'id', headerName: 'ID', width: 150 },
        { field: 'title', headerName: 'Title', width: 350 },
        {
          field: 'sales',
          headerName: 'Sales',
          type: 'number',
          width: 150,
        },
      ];
   } else {
    // display individual sales for movie   
    // create rows
      rows = data.result.map(res => {
          const row = {
              id: res.userID,
              user: res.userEmail,
              purchased: res.pdate,
              ...(rent ? {end: res.endDate} : {})
          }
          return row;
      });

      columns = [
        { field: 'id', headerName: 'ID', width: 150 },
        { field: 'user', headerName: 'User', width: 250 },
        { field: 'purchased', headerName: 'Purchased', flex: 1 },
        ...(rent ? [{field: 'end', headerName: 'End', flex: 1 }] : [])
      ];
   }

  return (
    <TableContainer>
      <DataGrid rows={rows} columns={columns} pageSize={8} />
    </TableContainer>
  );
};

const TableContainer = styled.section`
  margin-top: 20px;
  border-radius: 15px;
  padding: 0;
  width: 100%;
  height: 580px;
  * {
    z-index: 0;
  }
`;

// movie summary section
function Movie(props) {
    const {title, go} = props;
    const [movie, setMovie] = React.useState(undefined);
    const [load, setLoad] = React.useState(false);
    const [promoted, setPromoted] = React.useState(false);
    const api = new API();
    const history = useHistory();

     // fetch movie data on go
     React.useEffect(() => {
          if (title) {
             setLoad(true);
              // construct url query
             const query = {
                 title,
             }
             const queryStr = new URLSearchParams(query).toString();
            // fetch movie data from backend
             api.getJSON(`user/admin/movie?${queryStr}`, Session.authHeader())
                 .then(res=>{
                     console.log(res);
                     setMovie(res);
                     setPromoted(res.ispromoted);
                     setLoad(false);
                 }).catch((err) => {setLoad(false)});
          } else {
              setMovie(null);
          }
      }, [go]);


    //admin only, promote movie on homepage
    const handlePromote = () => {
        const data = {
            'movieID': movie.id,
            'promote': !movie.ispromoted,
        }
        // send promote or unpromote request
        api.postJSON('user/admin/promote', data, Session.authHeader())
            .then(r => {
                setPromoted(!promoted);
            }).catch((err) => console.log(err['message']));
            
    }

    // return nothinh if not movie selected
    if (!movie && !load) {
        return (null);
    }

    // return loading sign while fetching movie
    if (load) {
        return (<Load><i className="fas fa-spinner fa-spin"></i></Load>);
    }

    return (
        <MovieBox>
            <Edit>
                <Button 
                    onClick={() => {history.push(`/edit/${movie.id}`)}}
                    variant="contained"  
                    color="primary"
                >
                   EDIT
                </Button>
                <Button 
                    onClick={handlePromote}
                    variant="contained"  
                    color="primary"
                >
                   {promoted ? 'unpromote' : 'promote'}
                </Button>
            </Edit>
            <Info>
                <Left>
                    <header> {movie.title} </header>
                    <Poster>
                        <Thumbnail id={movie.id} src={movie.url} alt={movie.title + ' poster'} width='300'/>
                    </Poster>
                    <RatingWrap>
                        <Rating name="half-rating-read" value={movie.rating} precision={0.5} readOnly size="medium"/>
                        <span> {movie.rating} </span>  
                        <span> ({movie.numRating}) </span>
                    </RatingWrap>
                </Left>
                <Right>
                    <InfoLabel >
                        <header>Overview: </header>
                        {movie.overview}
                    </InfoLabel>
                    <InfoLabel >
                        <header>Language: </header>
                        {ISO6391.getName(movie.language)}
                    </InfoLabel>
                    <InfoLabel >
                        <header>MPAA: </header>
                        {movie.adult}
                    </InfoLabel>
                    <InfoLabel >
                        <header>Genre: </header>
                        {movie.genres.join(', ')}
                    </InfoLabel>
                    <InfoLabel >
                        <header>Keywords: </header>
                        {movie.keywords.join(', ')}
                    </InfoLabel>
                    <InfoLabel >
                        <header>Release Date: </header>
                        {movie.release_date}
                    </InfoLabel>
                    <InfoLabel >
                        <header>Purchase Price: </header>
                        ${movie.purchaseprice}
                    </InfoLabel>
                    <InfoLabel >
                        <header>Rent Price: </header>
                        ${movie.rentprice}
                    </InfoLabel>
                </Right>
            </Info>
        </MovieBox>
    )
    
}

const MovieBox = styled.section`
    width: 100%;
    display: flex;
    flex-direction: column;
    
`;

const Edit = styled.section`
    width: 100%;
    display: flex;
    justify-content: flex-end;

    > button {
        margin: 10px;
    }
`;

const Info = styled.section`
    width: 100%;
    display: flex;
    margin: 20px 0 50px 0;
`;

const Left = styled.section`
    flex: 1; 
    display: flex;
    flex-direction: column;
    > * {
        margin-bottom: 20px;
    }
    > header {
        font-size: 1.5rem;
        font-weight: bold;
    }
`;

const Right = styled.section`
    flex: 1;  
    display: flex;
    flex-direction: column
`;

const InfoLabel = styled.section`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    font-size: 1rem;
    margin-bottom: 20px;
    

    > header {
        font-size: 1rem;
        font-weight: bold;
        margin-right: 5px;
    }
`;

const Poster = styled.section`
    width: 240px;
    height: 350px;
`;

const RatingWrap = styled.section`
    width: 100%;
    display: flex;
    align-items: center;
    height: 50px;
    
    > span {
        line-height: 1;
    }
    > span:nth-child(2) {
        margin: 0 15px 0 5px;
    }
`;

const Load = styled.section`
    font-size: 2rem;
`;
