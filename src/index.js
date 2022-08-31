import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const participants = [];

app.post("/participants", (req, res) => {
	const { name } = req.body;

	if (name === "") {
		res.sendStatus(422);
	}

	res.sendStatus(201);
});

app.get("/participants", (req, res) => {});

app.post("/messages", (req, res) => {
	const { to, text, type } = req.body;
	const from = req.headers.User;

	/* const isFromValidedUSer = participants.find((el) => el.User === from); */

	for (i in participants) {
		if (to != "" || text != "") {
			continue;
		}
		if (type === "message" || type === "privade_message") {
			continue;
		}
		if (from === participants[i].name) {
			return res.sendStatus(201);
		}
	}

	res.sendStatus(422);
});

app.get("/messages", (req, res) => {
	const { limit } = req.query;
	const User = req.headers.User;
});

app.post("/status", (req, res) => {
	const User = req.headers.User;

	const isFromValidedUSer = participants.find((el) => el.User === from);

	if (isFromValidedUSer) {
		return res.sendStatus(200);
	}

	res.sendStatus(404);
});

app.listen(5000, () => {
	console.log("Listening on port 5000");
});
