var TaskNameToID = new Map(); // task name to task id
var Tasks = new Map(); // task id to Task class
var Clients = new Map(); // cleint id to client name
var apibase = 'https://clicktime.herokuapp.com/api/1.0';
var Session;

// Task class has Map of client ids to a list of job ids
class Task {
	constructor(name_in, taskid_in) {
		this.clients = new Map(); // Map<clientid, [jobids]>
		this.name = name_in;
		this.id = taskid_in;
	}

	addJob(clientid, job) {
		if (!this.clients.has(clientid)) {
			this.clients.set(clientid, []);
		}
		this.clients.get(clientid).push(job);
	}
};

// helper function to display tasks in HTML
function displayTasks(task_name) {
	console.log(task_name);
	$("#displaying").html(task_name);
	//$("#displaying").append();

	if (TaskNameToID.has(task_name) && Tasks.has(TaskNameToID.get(task_name))) {
		// display tasks
		console.log("Task found");
		$('#display-tasks').empty();
		
		var task_str = "";
		Tasks.get(TaskNameToID.get(task_name)).clients.forEach(function(jobs, clientid) {
			task_str += "<div class='card'>";
			task_str += "<h4>Client: " + Clients.get(clientid) + "</h4>";
			task_str += "<h5>Jobs:</h5><ul>";
			jobs.forEach(function(job) {
				task_str += "<li><h6>" + job + "</h6></li>";
			});
			task_str += "</ul></div>";
		});
		console.log(task_str);
		$('#display-tasks').append(task_str);
	} else {
		console.log("No tasks");
		$('#display-tasks').empty();
		$('#display-tasks').append(
			"<h5>" + "This task does not exist." + "</h5>"
		);
	}
}

$(document).ready(function() {
	var getSession = $.get({
		url: apibase + '/session',
		dataType: 'jsonp'
	}).done(function(session) {
		$('#email').html(session.UserEmail);
		$('#name').html(session.UserName);
		
		Session = session;
		console.log(Session);

		var getClients = $.get({
			url: apibase + '/Companies/' + Session['CompanyID'] + '/Users/' + Session['UserID'] + '/Clients',
			dataType: 'jsonp'
		});
		var getJobs = $.get({
			url: apibase + '/Companies/' + Session['CompanyID'] + '/Users/' + Session['UserID'] + '/Jobs?withChildIDs=true',
			dataType: 'jsonp'
		});
		var getTasks = $.get({
			url: apibase + '/Companies/' + Session['CompanyID'] + '/Users/' + Session['UserID'] + '/Tasks',
			dataType: 'jsonp'
		});

		$.when(getClients, getJobs, getTasks).done(function(resp_clients, resp_jobs, resp_tasks) {
			// TASK
			if (resp_tasks[1] === "success") {
				console.log("Tasks:");
				resp_tasks[0].forEach(function(task) {
					//console.log(task);
					//console.log(task['Name']);
					Tasks.set(task['TaskID'], new Task(task['Name'], task['TaskID']));
					TaskNameToID.set(task['Name'], task['TaskID']);
				});
			}

			// CLIENT
			if (resp_clients[1] === "success") {
				console.log("Clients: ");
				resp_clients[0].forEach(function(client) {
					//console.log(client);
					Clients.set(client['ClientID'], client['Name']);
				});
			}
			
			// JOB
			if (resp_jobs[1] === "success") {
				console.log("Jobs: ");
				resp_jobs[0].forEach(function(job) {
					//console.log(job);
					console.log(job['Name']);
					var taskids = job['PermittedTasks'].split(',');
					taskids.forEach(function(taskid) {
						if (Tasks.has(taskid) && Clients.has(job['ClientID'])) {
							console.log("Adding task " + taskid);
							Tasks.get(taskid).addJob(job['ClientID'], job['Name']);
						}
						else {
							console.log("Task " + taskid + " or Client " + job['CLientID'] + " doesn't exist.");
						}
					});
				});
			}

			console.log('Clients');
			console.log(Clients);
			console.log('Tasks');
			console.log(Tasks);
			Tasks.forEach(function(task, taskid) {
				console.log(taskid + " - " + task['name']);
				task['clients'].forEach(function(jobs, clientid) {
					jobs.forEach(function(job) {
						console.log("\t" + clientid + " - " + job);
					});
					
				});
				
			});
		});

	});

	$('#search-box').keyup(function(e) {
		e.preventDefault();
		displayTasks($('#search-box').val());
	});

	$('#search-button').click(function(e) {
		e.preventDefault();
		displayTasks($('#search-box').val());
	});

});


