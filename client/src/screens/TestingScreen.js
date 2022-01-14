import React, { useState, useEffect } from 'react'
import { useDispatch,useSelector } from 'react-redux'
import ImageUploader from 'react-images-upload'
import { uploadFirebase } from '../actions/uploadActions'
import { FormControl, Select, MenuItem, InputLabel } from '@material-ui/core';
import API from '../api.js';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';


// For testing API
export default function TestingScreen() {
    const dispatch = useDispatch()
    const [image,setImage] =useState()
    const [type, setType] = React.useState('GET');
    const typeOptions = ['GET', 'POST'];
    const [path, setPath] = React.useState('');
    const [tok, setTok] = React.useState("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NjczLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSJ9.7b7SgDXIdtmA5ddTRDTgE9Kod7t4_HRMJbm_ItlZF_Y");
    const [json, setJSON] = React.useState('');
    const [res, setRes] = React.useState('');
    const api = new API();
    const onSubmit = (e) => {
        // stop auto redirect
        e.preventDefault();

        if (type === 'GET') {
            api.getJSON(path, { Authorization: `Bearer ${tok}`})
                .then(r => {
                    console.log(r);
                    setRes(JSON.stringify(r));
                })
                .catch((err) => alert(err['message']));
        } else {
            let data = {}
            try {
                data = JSON.parse(json);
            } catch(e) {
                alert("Body: incorrect json format");
                return;
            }
            api.postJSON(path, data, { Authorization: `Bearer ${tok}`})
                .then((r) => {
                   console.log(r);
                   setRes(JSON.stringify(r));
                 })
                .catch((err) => alert("Response error: " + err['message']));
        }
    };

    const handleUpload = () =>{
        if(image === undefined){
            alert('Please upload cover image');
            return
        }
        dispatch( uploadFirebase(image) )
    }

    return(
        <Screen>
            <Form onSubmit={onSubmit} autoComplete="off">
                <Header>Test</Header>
                <Label htmlFor="select-type">                      
                        <Options
                            
                            labelId="type-label"
                            id="select-type"
                            value={type}
                            onChange={(e) => {setType(e.target.value);}}
                            range={typeOptions}
                        />
                </Label>
                <Label htmlFor="path">
                  <span>Path:</span>
                  <span>e.g. user/login (do not include /api/)</span>
                  <input
                      type="text"
                      id="path"
                      name="path"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                  />
                </Label>
                <Label htmlFor="token">
                  <span>Token:</span>
                  <input
                      type="text"
                      id="token"
                      name="token"
                      value={tok}
                      onChange={(e) => setTok(e.target.value)}
                  />
                </Label>
                <Label htmlFor="json">
                  <span>Body:</span>
                  <textarea
                      rows='10'
                      id="json"
                      name="json"
                      value={json}
                      onChange={(e) => setJSON(e.target.value)}
                  />
                </Label>
                <Label htmlFor="res">
                  <span>Response:</span>
                  <textarea
                      rows='10'
                      
                      id="res"
                      name="res"
                      value={res}
                      onChange={(e) => setRes(e.target.value)}
                  />
                </Label>
                <Button 
                    type="submit"
                    variant="contained" 
                    size="large" 
                    style={{ backgroundColor: 'white' }}
                >
                    Submit
                </Button>
            </Form>
            {/*<div>
        <ImageUploader
        imgExtension={['.jpg', '.png']}
        label="Maximum file size: 5MB , accepted format: jpg|png"
        maxFileSize={5242880}
        withPreview={true}
        singleImage={true}
        onChange={(Files) => setImage(Files[0])}

        />

        <button 
            onClick = {handleUpload}>
            upload to firebase
        </button>


        </div>*/}
        </Screen>
    )

    
}

const Screen = styled.section`
    border: none;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    
`;

const Form = styled.form`
    margin-top: 150px;
    padding: 20px;
    border: none;
    width: 50vw;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    > * {
        margin-bottom: 40px;
    }
    background-color: white;
`;

const Header = styled.header`
    font-weight: bold;
    font-size: 2.5rem;
    
`;

const Label = styled.label`
    display: flex;
    flex-direction: column;
    width: 70%;
    > * {
        min-height: 30px;
    }

    input {
        width: 100%;
        font-size: 1.5rem;
        height: 40px;
    }

    span {
        margin-bottom: 5px;
        font-size: min(6vw, 1.5rem);
        
    }
`;

const RegisterContainer = styled.section`
    display: flex;
    align-items: baseline;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 50px;
    > * {
        color: white;
        font-size: 1rem;
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