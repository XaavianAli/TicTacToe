# Tic Tac Toe

This project was created for the Prevu3d technical test by Xaavian Ali. It is available to play at http://ec2-18-218-71-138.us-east-2.compute.amazonaws.com:3000

## Information

This application's frontend was written using HTML, CSS, and React, and built using the create-react-app npm package. The Backend is powered by a Node.js server using the ws module to connect to players. The frontend is deployed on and AWS EC2 container running Ubuntu 20.04. Due to time constraints and limited knowledge of AWS Lambda, the backend was deployed on AWS EC2 as well.

### Features

Features include:
- 2 players with unlimited spectators
- Game resets when a player disconnects
- The next person to connect will take the spot as a player rather than a specatator
- Waits for both players to confirm vefore staring a new match
