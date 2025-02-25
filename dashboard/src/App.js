import logo from './logo.svg';
import './App.css';
import React, { useState, Component } from 'react';
import { DayPilot, DayPilotCalendar } from "daypilot-pro-react";
import ProgressBar from './ProgressBar.js';
import Calendar from './Calendar.js';
import {LineChart,BarChart} from './Chart.js';

import './Figma.css';
import { requirePropFactory } from '@material-ui/core';
import { user1, Purchase, Account } from './store.js';
import { startOfWeek, format, addDays, getTime, parseJSON } from 'date-fns'
import { loadUser, updateUser, addPurchase } from './Backend.js'
require('typeface-roboto');


//going to previous and next = add/subtract 7 days
//add currentFirstDay which use to determine what to render in that week
//only class should be purchase, day should be converted into a Date object
//checkboxes for each repetition day so attribute is an array not a string
//getDay returns 0-6 corresponding to M-S
//isEqual() compares date objects


// let formattedFirstDay = format(firstDay,' EEEEEE M/d');
// console.log(formattedFirstDay);
const findPurchaseTotal = (account, startOfWeek) => {
  let sum = 0;
  for (const purchase of account.purchases) {
    if (purchase.repetition.length > 0) {
      sum += purchase.repetition.length * purchase.price;
    }
    else if (getTime(purchase.day) >= getTime(startOfWeek) && getTime(purchase.day) < getTime(addDays(startOfWeek, 7)))
      sum += purchase.price;

  }
  return sum;
}

const findPriceDistribution = (account, startOfWeek) => {
  let prices = {};
  let pricesArr = [];
  for (const purchase of account.purchases) {
    if (purchase.repetition.length > 0) {
      if (purchase.category in prices) {
        prices[purchase.category] += purchase.price*purchase.repetition.length;

      }
      else {
        prices[purchase.category] = purchase.price*purchase.repetition.length;

      }
    }
    else if (getTime(purchase.day) >= getTime(startOfWeek) && getTime(purchase.day) < getTime(addDays(startOfWeek, 7))){
      console.log(purchase.name)
      if (purchase.category in prices) {
        prices[purchase.category] += purchase.price;
      }
      else {
        prices[purchase.category] = purchase.price;

      }
    }


  }
  for (const key in Object.keys(prices)) {
    pricesArr.push(prices[Object.keys(prices)[key]])
  }
  return [pricesArr,Object.keys(prices)];
}

const generateDailyCosts = (account, startOfWeek) => {
  let cumulativeCost = 0;
  let budget = account.weeklyBudget;
  let days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  let dailyCosts = [budget, budget, budget, budget, budget, budget, budget];
  for (let i = 0; i < 7; i++) {
    for (const purchase of account.purchases) {
      if (purchase.repetition.includes(days[i])) {
        cumulativeCost += purchase.price;
      }
      else if (format(purchase.day, 'EEEEEE') === days[i] && (getTime(purchase.day) >= getTime(startOfWeek) && getTime(purchase.day) < getTime(addDays(startOfWeek, 7)))) {
        cumulativeCost += purchase.price;
      }

    }
    dailyCosts[i] -= cumulativeCost;
  }
  return dailyCosts
}

const statusMessage = (account, budget, categoryPrices, startOfWeek) => {
  if (findPurchaseTotal(account, startOfWeek) <= budget) {
    return ["On Track!", "Keep it up!"]
  }
  else {
    let maxCategory = "";
    let maxPrice = 0;
    for (const key in categoryPrices) {
      if (categoryPrices[key] > maxPrice) {
        maxCategory = key;
        maxPrice = categoryPrices[key]
      }
    }
    if (maxCategory === "") {
      return ["No purchases made yet", "N/A"];
    }
    return ["Warning", " Consider reducing spending in " + maxCategory];
  }
}

const parseRepetitions = (repetition) => {
  let dates = [];
  if (repetition === "No") {
    return repetition;
  }
  let startIndex = 0;
  for (let i = 0; i < repetition.length; i++) {
    if (repetition.substring(i, i + 1) === "/") {
      dates.push(repetition.substring(startIndex, i));
      startIndex = i + 1;
    }
  }
  dates.push(repetition.substring(repetition.length - 1, repetition.length));
  return dates;
}




// edit these values after filling in the forms in the Add Purchase page.
let name = "Chipotle";
let price = 11;
let category = "Food";
let date = "2022-12-30";
let repetition = "Mo,We";
let examplePurchase = {name: `${name}`, price: `${price}`, category: `${category}`, date: `${date}`, repetition: `${repetition}`};


function App() {
  const [account,setAccount] = useState(user1);

  const [firstDay, setDate] = useState(startOfWeek(new Date()));
  const alterDate = (count) => {
    setDate(addDays(firstDay, count));
    console.log(addDays(firstDay, count))
  }

  const visualizationDict = {
    one: <LineChart dailyCosts={generateDailyCosts(account, firstDay)} />,
    two: <BarChart dailyCosts={findPriceDistribution(account,firstDay)[0]} categoryLabels={findPriceDistribution(account,firstDay)[1]} />
  }
  const vals = findPriceDistribution(user1, firstDay);
  const [visualization,setVisualization] = useState(["one","two"])
  //create a copy, splice copy,set original visualization to copy
  //find computer ip address, disable firewall for that port (verify 3306 is right and open)
  const toggleVisualization = () => {

    const firstElem = visualization[0]
    visualization.splice(0,1);
    console.log(visualization);
    const megaClone = visualization.concat([firstElem]);
    console.log(megaClone);
    console.log( Object.assign(megaClone));
    setVisualization( Object.assign(megaClone));

  }

  const alterBudget = (account) => {
    if (document.getElementById("alter-budget-input") !== null) {
      console.log(document.getElementById("alter-budget-input").value);
      account.weeklyBudget = document.getElementById("alter-budget-input").value;
      handleChange(account);
    }

  }



  const handleChange = (newAccount) => {
    const accountCopy = Object.assign(Object.create(Object.getPrototypeOf(newAccount)), newAccount);
    console.log(accountCopy);
    setAccount(accountCopy);
  }
  return (

    <div className="App">

      <div id="frame"><span id="dashboard-title">My Dashboard</span>
        <div id="next-box"></div>
        <span onClick={() => alterDate(-7)} id="previous">Previous</span>
        <div id="previous-box"></div>
        <span onClick={() => alterDate(7)} id="next">Next</span>

        <Calendar onChange ={handleChange} startDate={firstDay} account={account}/>
        {/* TODO: grid layout from MDN guide for columns */}


        <div id="report-header-box"></div>
        <div id="visualization-header-box"></div>
        <span id="report-header">Status Report: {statusMessage(account, account.weeklyBudget, vals, firstDay)[0]}</span>
        <span onClick={() => toggleVisualization()} id="visualization-header">Toggle Visualizations</span>
        <div id="report"></div>
        <div id="visualization">
          {visualizationDict[visualization[0]]}
        </div>
        <ProgressBar percentage={(findPurchaseTotal(account, firstDay) / account.weeklyBudget * 100)>99 ? 100 : (findPurchaseTotal(account, firstDay) / account.weeklyBudget * 100)} />



        <span id="e2_91">You’re projected to spend {Math.round(findPurchaseTotal(account, firstDay) / account.weeklyBudget * 100)}% of your weekly budget</span>
        <span id="recommendation">Recommendation: {statusMessage(account, account.weeklyBudget, vals, firstDay)[1]}
        </span>
        <span id="total-spending">Your current budget is ${account.weeklyBudget} and current total spending is ${findPurchaseTotal(account, firstDay)}</span>


        <div id="add-purchase" onClick={() => addPurchase(examplePurchase,account,handleChange)}>  Add Purchase</div>
        <div id="sign-out"> Sign Out</div>
        <input id ="alter-budget-input" type="text" name="budget" />
          <button id="alter-budget"   onClick={() => alterBudget(account)}>Alter Budget</button>



      </div>
    </div>
  );
}

export default App;
