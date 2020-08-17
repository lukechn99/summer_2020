# summer_2020
Google Doc:
https://docs.google.com/document/d/1wmxIVC2qE-FJ6cfsiY5HSu9gsvDUF_meoxXCuo7gLz0/edit?usp=sharing

## TODO:  
- ~Assign S3 full access for code~
- ~create s3 bucket~
- Add functionality for Ghosts to repossess people
- Add a win screen at the end of the game
	-Determine which players reach the win screen.
	-Button on screen which resets spectator status and lets players start a new game
- Add a button before the game starts to become spectator instead of player
- Revise staying awake

## Notes:  
- `ssh ec2-user@18.217.107.58 -i practice_instance.pem` from the cloned project folder to ssh into the EC2 instance
- Whenever website code is updated, it needs to be uploaded to S3 -> /var/www/html [source](https://www.youtube.com/watch?v=dhRwKPrum44)
Use `aws s3 sync s3://summer-2020 /var/www/html` to sync the EC2 to the code within 
- accessible at (http://18.217.107.58/) or port (http://18.217.107.58:3000/)
