import React from 'react';
import styled from 'styled-components';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import * as Session from './session';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TestingScreen from './screens/TestingScreen';
import SearchScreen from './screens/SearchScreen';
import MovieScreen from './screens/MovieScreen';
import CreateMovieScreen from './screens/CreateMovieScreen';
import ProfileScreen from './screens/ProfileScreen';
import SaleScreen from './screens/SaleScreen';
import CartScreen from './screens/CartScreen';
import PaymentScreen from './screens/PaymentScreen';
import HistoryScreen from './screens/HistoryScreen';
import WatchScreen from './screens/WatchScreen';
import SurveyScreen from './screens/SurveyScreen';
import AdminScreen from './screens/AdminScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';



function App() {
  // initialise cache
  React.useEffect(() => {
      Session.getOptions()
      .then(r => console.log("init success"))
      .catch((err) => console.log("init fail:", err['message']));
    }, []);

  return (
    <BrowserRouter>
      <Header />
      <Switch>
          <Route exact path="/">
              <HomeScreen />
          </Route>
          <Route path="/login">
              <LoginScreen />
          </Route>
          <Route path="/register">
              <RegisterScreen />
          </Route>
          <Route path="/search">
              <SearchScreen />
          </Route>
          <Route path="/movie/:id">
              <MovieScreen />
          </Route>
          <Route path="/profile">
              <ProfileScreen />
          </Route>
          <Route path="/cart">
              <CartScreen />
          </Route>
          <Route path="/payment">
              <PaymentScreen />
          </Route>
          <Route path="/history">
              <HistoryScreen />
          </Route>
          <Route path="/create">
              <CreateMovieScreen />
          </Route>
          <Route path="/edit/:id">
              <CreateMovieScreen />
          </Route>
          <Route path="/watch/:id">
              <WatchScreen />
          </Route>
          <Route path='/survey'>
              <SurveyScreen />
          </Route>
          <Route path='/admin'>
              <AdminScreen />
          </Route>
          <Route exact path="/testing">
              <TestingScreen />
          </Route>
      </Switch>

      <Chatbot />
      <Footer />
    </BrowserRouter>
  );
}



export default App;

