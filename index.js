#!/usr/bin/env node

const { exec } = require('child_process');

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);   

if (!args[0] || !args[1]){
    console.log('\x1b[31m', 'Invalid parameters.', '\x1b[0m');
    return;
}

const year = parseInt(args[0]);
let percentage = parseInt(args[1]);

let current_year = new Date();
current_year.getYear();

if (percentage < 1 || percentage > 100){
    console.log('\x1b[31m', 'Invalid percentage.', '\x1b[0m');
    return;
}

if (percentage){ percentage /= 100 }

if (year < 2006 || year > current_year){
    console.log('\x1b[31m', 'Invalid date.', '\x1b[0m');
    return;
} 

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        reject(`Erro: ${error.message}`);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getAllDates(year) {
    const totalDays = isLeapYear(year) ? 366 : 365;
    const dates = [];

    for (let i = 0; i < totalDays; i++) {
        const date = new Date(year, 0, i + 1);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getRandomPercentDates(year, percentage = 1) {
    const allDates = getAllDates(year);
    if (percentage == 1){
      return allDates;
    }
    shuffleArray(allDates);

    const sixtyPercentCount = Math.floor(allDates.length * percentage);
    return allDates.slice(0, sixtyPercentCount);
}

async function gitCommit() {
  try {

    await runCommand('git add .');

    await runCommand('git commit -m "Commit"');

  } catch (error) {
    console.error(error);
  }
}

const writeFilePromise = (content) => {

    const filePath = path.join(process.cwd(), 'commits.txt');

    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

};

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function execute (){

    console.log('\x1b[32m', 'Starting commits in the year ' + year, '\x1b[0m');
    
    const randomDates = getRandomPercentDates(year, percentage);

    let commits_count = 0;

    for (const date of randomDates){

        const rand = getRandomNumber(1, 6); //random number of commits :D

        process.env.GIT_COMMITTER_DATE = `${date} 00:00:00`;
        process.env.GIT_AUTHOR_DATE = `${date} 00:00:00`;

        for (let j = rand; j > 0; j--){
            await writeFilePromise(`${date} 00:00:00 ${rand} - ${j} - ${new Date().getTime()}`) 
            await gitCommit();
            commits_count += 1;
        }
    }

    await writeFilePromise('') 

    await gitCommit();
    
    await runCommand("git push --set-upstream origin master")

    console.log('\x1b[32m', `Finished. :D number of commits made ${commits_count}`, '\x1b[0m');
}

execute();