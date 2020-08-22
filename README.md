# Walter Library: The horror game
Google Doc:
https://docs.google.com/document/d/1wmxIVC2qE-FJ6cfsiY5HSu9gsvDUF_meoxXCuo7gLz0/edit?usp=sharing

## TODO:  
- ~Assign S3 full access for code~
- ~create s3 bucket~
- Add functionality for Ghosts to repossess people
	-added function to get possessed. Completed
	-inform user to choose a new host.Completed
	-Bring up UI for user to choose host.
	-Receive input and possess people
		Route 1;
	-make sure the night doesn't start before dead ghosts choose a new host.
	-inform new ghosts that they are now ghosts.
		Route 2;
	-make sure the next day doesn't start before ghosts choose a new host.
	-inform new ghosts at the start of the day of their ghost status.
- Add a win screen at the end of the game
	-Determine which players reach the win screen.
	-Button on screen which resets spectator status and lets players start a new game
- Revise staying awake :Completed

## Notes:  
- `ssh ec2-user@18.217.107.58 -i practice_instance.pem` from the cloned project folder to ssh into the EC2 instance
- Whenever website code is updated, it needs to be uploaded to S3 -> /var/www/html [source](https://www.youtube.com/watch?v=dhRwKPrum44)
Use `aws s3 sync s3://summer-2020 /var/www/html` to sync the EC2 to the code within 
- accessible at (http://18.217.107.58/) or port (http://18.217.107.58:3000/)
