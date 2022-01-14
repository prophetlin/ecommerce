import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux'
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import API from '../api';
import * as Session from '../session';
import ISO6391 from 'iso-639-1';
import ImageUploader from 'react-images-upload';
import { firebase_app } from '../base.js';
import LoadingBox from '../components/LoadingBox';

// for keywords, limit number of rendered matches to first hundred to prevent lag
const filterOptions = createFilterOptions({
    limit: 100
  });

export default function CreateMovieScreen() {
    const history = useHistory();
    const api = new API();
    //movie's id
    const { id } = useParams();
    //load while submitting form
    const [load, setLoad] = useState(false);
    //load while retreiving movie details
    const [loadEdit, setLoadEdit] = useState(true);

    //edit status
    const [originTitle,SetoriginTitle] = useState("");
    const [originurl, setOriginUrl] = useState();
    const [isNewposter, setIsNewposter] = useState(false);

    //options
    const [Options,setOptions] = useState(undefined);

    //selected options
    const [selectGens,setSelectgens] = useState([]);
    const [selectKeys,setSelectkeys] = useState([]);
    const [selectLang,setSelectLang] = useState("");
    const [selectAge,setSelectAge] = useState("");

    //upload img
    const [image,setImage] =useState();

    //inputs
    const [titleInput,setTitleInput] =useState("");
    const [overview,setOverview] = useState("");
    const [purchase,setPurchase] = useState(0);
    const [rent,setRent] = useState(0);
    const [runtime,setRuntime] = useState(0);
    const [date,setDate] = useState("");

    //handle user submit button click call back
    const handleSubmit = () =>{
        //checks for missing params     
        if(image === undefined && !originurl){
            alert('Please upload movie poster');
            return
        }
        if(titleInput === ""){
            alert('Please input movie title');
            return
        }
        if(selectLang === ""){
            alert('Please input movie language');
            return
        }
        if(overview === ""){
            alert('Please input movie overview');
            return
        }
        if(date === ""){
            alert('Please input movie release date');
            return
        }
        
        // if id exist then editing mode else create mode
        if(id){
            EditExistingMovie();
        }else{
            SubmitNewMovie();
        }
        
    }


    //submits new movie
    const SubmitNewMovie = () =>{
        setLoad(true);

        try {
            //upload image to firebase first
            const storageRef = firebase_app.storage().ref();
            const fileRef = storageRef.child(image.name);
            fileRef.put(image).then(snapshot => {
                //firebase returns a url after successful upload
                snapshot.ref.getDownloadURL().then(url => {
                    
                    //gather all the data to submit to backend 
                    const data = {
                        language : selectLang,
                        title : titleInput,
                        runtime : runtime,
                        age_rating : selectAge,
                        release_date : date,
                        overview : overview,
                        rentprice : rent,
                        purchaseprice : purchase,
                        url : url,
                        genres: selectGens,
                        keywords : selectKeys
                    }
                    //actually calling the backend 
                    api.postJSON('user/admin/create', data, Session.authHeader())
                    .then((r) => {
                        setLoad(false);
                        //redirect to the movie page after succesful create
                        history.push(`/movie/${r.movieID}`)
                       
                     })
                    .catch((err) => alert(err['message']));


                })
            })    
        } catch (error) {
            alert('Error while uploading');
            return; 
        }
    }
    
    const EditExistingMovie = () => {
        setLoad(true);

        try {
            //do we need to upload a new poster ? user might not make a change to the poster, in that case we dont talk to firebase
            if(isNewposter){
                //upload image to firebase first
                const storageRef = firebase_app.storage().ref();
                const fileRef = storageRef.child(image.name);
                fileRef.put(image).then(snapshot => {
                    //firebase returns a url after successful upload
                    snapshot.ref.getDownloadURL().then(url => {
                        
                        //gather all the data to submit to backend 
                        const data = {
                            id : id,
                            language : selectLang,
                            title : titleInput,
                            runtime : runtime,
                            age_rating : selectAge,
                            release_date : date,
                            overview : overview,
                            rentprice : rent,
                            purchaseprice : purchase,
                            url : url,
                            genres: selectGens,
                            keywords : selectKeys
                        }
                        
                        //actually calling the backend 
                        api.postJSON('user/admin/edit', data, Session.authHeader())
                        .then((r) => {
                            setLoad(false);
                            //redirect to the movie page after succesful edit 
                            history.push(`/movie/${r.movieID}`)
                           
                         })
                        .catch((err) => alert(err['message']));
    
                    })
                })  
            }else{
                //same thing except we dont upload image
                const data = {
                    id: id,
                    language : selectLang,
                    title : titleInput,
                    runtime : runtime,
                    age_rating : selectAge,
                    release_date : date,
                    overview : overview,
                    rentprice : rent,
                    purchaseprice : purchase,
                    url : originurl,
                    genres: selectGens,
                    keywords : selectKeys
                }
                console.log(data);

                api.postJSON('user/admin/edit', data, Session.authHeader())
                .then((r) => {
                    setLoad(false);
                    history.push(`/movie/${r.movieID}`)
                   
                 })
                .catch((err) => alert(err['message']));

            }
  
        } catch (error) {
            alert('Error while uploading');
            return; 
        }

    }



    //material ui autocomplete require the data to be in specific format
    const processOptions = (Options) =>{   
        // add language options
        Options.languages = ISO6391.getAllNames();
        return Options;
    }

    // init create form
    useEffect(() => {
        //retrieve all the edit options
        Session.getOptions()
        .then(res =>{
            const op = processOptions(res);
            setOptions(op)
        })
        .catch(err => console.log(err['message']))


        // if edit existing movie, init form entries with movie info
        if (id) {

            api.getJSON(`movie/${id}`, Session.authHeader())
            .then(res=>{
                SetoriginTitle(res.title);
                setTitleInput(res.title);
                setSelectgens(res.genres);
                setSelectLang(res.language);
                setSelectkeys(res.keywords);
                setSelectAge(res.adult);
                setOverview(res.overview);
                setPurchase(res.purchaseprice);
                setRent(res.rentprice);
                setRuntime(res.runtime);
                setDate(res.release_date);
                setOriginUrl(res.url);
                setLoadEdit(false);
            }).catch((err) => console.log(err['message']));

        }

    },[])

    // if user not admin redirect to home
    if (!Session.isAdmin()) history.push('/');

    // don't render form if options data or movie data has yet to be retreived
    if (Options === undefined || (id && loadEdit)) return (<Screen>(<LoadingBox /></Screen>);

    //(isNewposter || !id) is to decide wether we need to display the image uploader
    return(
        <Screen>
        <Head>{id ? `Edit "${originTitle}"`: "Create New Movie"}</Head>
        <Wrap>

            <Left>
                
                {(isNewposter || !id)
                
                ? (

                    <div>
                    
                        <Suploader
                         imgExtension={['.jpg', '.png']}
                         label="Maximum file size: 5MB , accepted format: jpg|png"
                         maxFileSize={5242880}
                         withPreview={true}
                         singleImage={true}
                         onChange={(Files) => setImage(Files[0])}
                        />
                    
                    </div>

                )
                : (


                    <div>
                        <InnerWrap>
                            {originurl ? (<PosterPic src={originurl} alt="cat"></PosterPic>) : null}
                        </InnerWrap>

                        <Button
                            onClick={() => setIsNewposter(true)}
                            variant="contained"  
                            color="primary">
                            Upload New Poster
                        </Button>                    
                    
                    </div>
                )}

                <Bwrap>
                    <Button variant="contained" color="secondary" size="large"
                        onClick = {handleSubmit}>
                        Submit 
                    </Button>
                    {load && <i className="fas fa-spinner fa-spin"></i>}
                </Bwrap>

            </Left>

            <Right>
            
                <Title>
                    <Text>Title</Text>
                    <White>
                    <Tinput
                        type="text" 
                        value = {titleInput}
                        onChange = {(e)=>{setTitleInput(e.target.value)}}
                        width='90%'
                    >
                    </Tinput>
                    </White>
                </Title>

                <Title>
                    
                    <Text>Genre</Text>
                        <White>
                        <Autocomplete
                            
                            multiple
                            id="tags-standard"
                            options={Options.genres}
                            getOptionLabel={(option) => option}
                            renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="standard"
                                InputProps={{...params.InputProps, disableUnderline: true}}

                            />
                            )}
                            value={selectGens}
                            onChange={(event, value) => setSelectgens(value)}
                        />
                        </White>


                </Title>

                <Title>
                    <Text>Language</Text>
                    <White>
                    <Autocomplete
                        
                        id="tags-standard"
                        options={Options.languages}
                        getOptionLabel={(option) => option}
                        renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            InputProps={{...params.InputProps, disableUnderline: true}}

                        />
                        )}
                        value = {ISO6391.getName(selectLang)}
                        onChange={(event, value) => setSelectLang(value ? ISO6391.getCode(value) : '')}
                    />
                    </White>
                </Title>

                <Title>
                    <Text>Keyword</Text>
                    <White>
                    <Autocomplete
                        filterOptions={filterOptions}
                        multiple
                        id="tags-standard"
                        options={Options.keywords}
                        getOptionLabel={(option) => option}
                        renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            InputProps={{...params.InputProps, disableUnderline: true}}

                        />
                        )}
                        value={selectKeys}
                        onChange={(event, value) => setSelectkeys(value)}
                    />
                    </White>
                </Title>

                <Title>
                    <Text>Age Ratings</Text>
                    <White>
                    <Autocomplete
                        id="tags-standard"
                        options={Options.ageRatings}
                        getOptionLabel={(option) => option}
                        renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            InputProps={{...params.InputProps, disableUnderline: true}}
                        />
                        )}
                        value={selectAge}
                        onChange={(event, value) => setSelectAge(value)}
                    />
                    </White>
                </Title>

                <Title>
                    Overview
                    <Stextarea
                        type="text" 
                        value = {overview}
                        onChange = {(e)=>{setOverview(e.target.value)}}
                    >
                    </Stextarea>
                </Title>
                <PriceBox>
                    <Title>
                        Purchase Price
                        <Sinput 
                            
                            type="number" step="1" pattern="\d+"
                            value={purchase}
                            onChange = {(e)=>{setPurchase(e.target.value)}}>
                        </Sinput>
                    </Title>
                    <Title>
                        Rent Price
                        <Sinput 
                            type="number" step="1" pattern="\d+"
                            value={rent}
                            onChange = {(e)=>{setRent(e.target.value)}}>
                            
                        </Sinput>
                    </Title>                  
                </PriceBox>

                <PriceBox>
                    <Title>
                        Runtime (minutes)
                        <Sinput 
                            type="number" step="1" pattern="\d+"
                            value={runtime}
                            onChange = {(e)=>{setRuntime(e.target.value)}}>
                            
                            
                        </Sinput>
                    </Title>
                    <Title>
                        Release Date
                        <Sinput 
                            type="date"
                            value={date}
                            onChange = {(e)=>{setDate(e.target.value)}}
                            width='150px'
                            >

                        </Sinput>
                    </Title>
                </PriceBox>

            </Right>
        </Wrap>
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

const Head = styled.div`
    color:white;
    font-size: 40px;
    font-weight: bold;
    text-align: center;
    margin:5rem;
`;

const Suploader = styled(ImageUploader)`
    width: 250px;
    height:20rem;
`;

const White = styled.div`
    background-color:white;
    padding: 10px;
    border-radius: 10px;
    input {
        border-bottom: none;
    }
`;

const Title =styled.div`
    
    padding-bottom: 3rem;

`;

const PriceBox = styled.div`
    display:flex;
    > * {
        margin-right: 50px;
    }

    input {
        margin-left: 10px;
    }
`;

const Text = styled.div`
    margin-bottom:1rem;

`;

const Stextarea = styled.textarea`
    padding: 15px;
    resize: none;
    font-size 20px;
    width:42rem;
    height:300px;
    border-radius: 5px;
    margin-top: 1rem;

`;

const Tinput = styled.input`
    border: none;
    outline: none;
    width: ${props => props.width ? props.width : '80px'};
    height: 2rem;
`;

const Sinput = styled.input`
    padding: 10px;
    border-radius: 5px;
    width: ${props => props.width ? props.width : '80px'};
    height: 2rem;
    font-size: 1rem;
`;

const Left = styled.div`
    flex: 1.5;
    display:flex;
    flex-direction: column;
`;

const Wrap = styled.div`
    display:flex;
    width: min(80vw, 1200px);
    color:white;
    font-size: 18px;
`;

const Right = styled.div`
    flex: 2;
    display:flex;
    flex-direction: column;
    padding: 20px;

`;

const PosterPic = styled.img`
    max-width: 100%;
    max-height: 100%;

`;

const InnerWrap = styled.div`
    width: 240px;
    height: 360px;
    @media only screen and (max-width: 1635px) {
        width: 180px;
        height: 240px;
      }

`;

const Bwrap = styled.span`
    margin-top: 2rem;
    > button {
        margin-right: 1rem;
    }

`;
