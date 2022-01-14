import React from 'react';
import styled from 'styled-components';
import TextField from '@material-ui/core/TextField';
import { FormControl, Select, MenuItem, InputLabel } from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid';
import { useHistory } from 'react-router-dom';
import API from '../api';
import * as Session from '../session';

// Deprecated
export default function SaleScreen() {
    const api = new API();
    const history = useHistory();
    const [type, setType] = React.useState('Purchases');
    const typeOptions = ['Purchases', 'Rentals'];
    const [time, setTime] = React.useState('Past Week');
    const timeOptions = ['Past Week', 'Past Month', 'Past Year', 'All Time'];
    const [sort, setSort] = React.useState('Most Sales');
    const sortOptions = ['Most Sales', 'Least Sales'];
    const [update, setUpdate] = React.useState(false);
    const [salesData, setSalesData] = React.useState({});

    // fetch sales data on inti or change of form
    React.useEffect(() => {
        // none admin users are directed to home
        if (!Session.isAdmin()) {
            history.push('/');
            return;
        }
        fetchData();
    }, [update]);

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
        }
        const queryStr = new URLSearchParams(query).toString();
        // fetch data
        api.getJSON(`user/admin/sales/${path}?${queryStr}`, Session.authHeader())
            .then((r) => {
                console.log(r);
                setSalesData(r);
            })
            .catch((err) => alert(err.message));
    };

	return (
        <Screen>
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

                    <Label htmlFor="select-sort">
                        <Options
                            
                            labelId="sort-label"
                            id="select-sort"
                            value={sort}
                            onChange={(e) => {setSort(e.target.value);}}
                            range={sortOptions}
                        />
                    </Label>
                </FormContainer>
                <Table data={salesData} descending={sort === sortOptions[0]}/>
            </Section>
            
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

const Section = styled.section`
    margin-top: 100px;
    padding: 30px;
    border-radius: 25px;
    width: min(80vw, 800px);
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
   
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
  margin: 20px 10px;
  
  span {
    margin: 10px;
    font-size: min(6vw, 1em);
    font-weight: bold;
  }
`;

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
  const { data, descending } = props;

  // empty data
  if (!data['result']) data['result'] = [];
  
  // create Movie:Sales data
  const res = {};
  const id = {};
  for (let i = 0; i < data.result.length; i++) {
      let title = data.result[i].movieTitle;
      res[title] = (res[title] || 0) + 1; 
      id[title] = data.result[i].movieID;
  }
  
  // create rows
  const rows = Object.keys(res).map((k, i) => {
      const row = {
          id: id[k],
          title: k,
          sales: res[k],
      }
      return row;
  });

  // sort rows
  if (descending) 
      rows.sort((a, b) => b.sales - a.sales);
  else
      rows.sort((a, b) => a.sales - b.sales);

  const columns = [
    { field: 'id', headerName: 'ID', width: 150 },
    { field: 'title', headerName: 'Title', width: 350 },
    {
      field: 'sales',
      headerName: 'Sales',
      type: 'number',
      width: 150,
    },
  ];

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
