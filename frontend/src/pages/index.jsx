import React, { Component } from 'react';
import { Api, JsonRpc, RpcError, JsSignatureProvider } from 'eosjs'; // https://github.com/EOSIO/eosjs
import { TextDecoder, TextEncoder } from 'text-encoding';

// material-ui dependencies
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';

// eosio endpoint
const endpoint = "http://localhost:8888";

// NEVER store private keys in any source code in your real life development
// This is for demo purposes only!
const accounts = [
  {"name":"useraaaaaaaa", "privateKey":"5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5", "publicKey":"EOS6kYgMTCh1iqpq9XGNQbEi8Q6k5GujefN9DSs55dcjVyFAq7B6b"},
  {"name":"useraaaaaaab", "privateKey":"5KLqT1UFxVnKRWkjvhFur4sECrPhciuUqsYRihc1p9rxhXQMZBg", "publicKey":"EOS78RuuHNgtmDv9jwAzhxZ9LmC6F295snyQ9eUDQ5YtVHJ1udE6p"},
  {"name":"useraaaaaaac", "privateKey":"5K2jun7wohStgiCDSDYjk3eteRH1KaxUQsZTEmTGPH4GS9vVFb7", "publicKey":"EOS5yd9aufDv7MqMquGcQdD6Bfmv6umqSuh9ru3kheDBqbi6vtJ58"},
  {"name":"useraaaaaaad", "privateKey":"5KNm1BgaopP9n5NqJDo9rbr49zJFWJTMJheLoLM5b7gjdhqAwCx", "publicKey":"EOS8LoJJUU3dhiFyJ5HmsMiAuNLGc6HMkxF4Etx6pxLRG7FU89x6X"},
  {"name":"useraaaaaaae", "privateKey":"5KE2UNPCZX5QepKcLpLXVCLdAw7dBfJFJnuCHhXUf61hPRMtUZg", "publicKey":"EOS7XPiPuL3jbgpfS3FFmjtXK62Th9n2WZdvJb6XLygAghfx1W7Nb"},
  {"name":"useraaaaaaaf", "privateKey":"5KaqYiQzKsXXXxVvrG8Q3ECZdQAj2hNcvCgGEubRvvq7CU3LySK", "publicKey":"EOS5btzHW33f9zbhkwjJTYsoyRzXUNstx1Da9X2nTzk8BQztxoP3H"},
  {"name":"useraaaaaaag", "privateKey":"5KFyaxQW8L6uXFB6wSgC44EsAbzC7ideyhhQ68tiYfdKQp69xKo", "publicKey":"EOS8Du668rSVDE3KkmhwKkmAyxdBd73B51FKE7SjkKe5YERBULMrw"}
];
// set up styling classes using material-ui "withStyles"
const styles = theme => ({
  card: {
    margin: 20,
  },
  paper: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
  formButton: {
    marginTop: theme.spacing.unit,
    width: "100%",
  },
  pre: {
    background: "#ccc",
    padding: 10,
    marginBottom: 0,
  },
});

// Index component
class Index extends Component {

  constructor(props) {
    super(props)
    this.state = {
      noteTable: [], // to store the table rows from smart contract
      chats: []
    };
    this.handleFormEvent = this.handleFormEvent.bind(this);
    this.handleSendMessageFormEvent = this.handleSendMessageFormEvent.bind(this);

    window.eosRpc = new JsonRpc(endpoint);
    const signatureProvider = new JsSignatureProvider(['5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5']);
    window.eosApi = new Api({ rpc: window.eosRpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
  }

  // generic function to handle form events (e.g. "submit" / "reset")
  // push transactions to the blockchain by using eosjs
  async handleFormEvent(event) {
    // stop default behaviour
    event.preventDefault();

    // collect form data
    let account = event.target.account.value;
    let privateKey = event.target.privateKey.value;
    let accountTwo = event.target.accountTwo.value;
    // console.log(`private key is ${privateKey}`)

    // prepare variables for the switch below to send transactions
    let actionName = "";
    let actionData = {};

    // define actionName and action according to event type
    switch (event.type) {
      case "submit":
        actionName = "create";
        actionData = {
          user: account,
          user_two: accountTwo,
          stake_requirement: 10 * Math.pow(10,4), // 10.0000
          response_window: 60, // 1 minute in seconds
          expiration_time: parseInt(new Date().getTime() / 1000) + 60 * 60 // 60 minutes
        };
        break;
      default:
        return;
    }

    // eosjs function call: connect to the blockchain
    const rpc = new JsonRpc(endpoint);
    const signatureProvider = new JsSignatureProvider([privateKey]);
    const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
    try {
      const result = await api.transact({
        actions: [{
          account: "notechainacc",
          name: actionName,
          authorization: [{
            actor: account,
            permission: 'active',
          }],
          data: actionData,
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      });

      console.log(result);
      this.getTable();
    } catch (e) {
      console.log('Caught exception: ' + e);
      if (e instanceof RpcError) {
        console.log(JSON.stringify(e.json, null, 2));
      }
    }
  }

  async handleSendMessageFormEvent(event) {
    // stop default behaviour
    event.preventDefault();

    // collect form data
    let account = event.target.account.value;
    let privateKey = event.target.privateKey.value;
    let chatId = event.target.chatId.value;
    let message = event.target.message.value;

    // prepare variables for the switch below to send transactions
    let actionName = "";
    let actionData = {};

    // define actionName and action according to event type
    switch (event.type) {
      case "submit":
        actionName = "sendmessage";
        actionData = {
          user: account,
          chat_id: chatId,
          message: message
        };
        break;
      default:
        return;
    }

    // eosjs function call: connect to the blockchain
    const rpc = new JsonRpc(endpoint);
    const signatureProvider = new JsSignatureProvider([privateKey]);
    const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
    try {
      const result = await api.transact({
        actions: [{
          account: "notechainacc",
          name: actionName,
          authorization: [{
            actor: account,
            permission: 'active',
          }],
          data: actionData,
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      });

      console.log(result);
      this.getTable();
    } catch (e) {
      console.log('Caught exception: ' + e);
      if (e instanceof RpcError) {
        console.log(JSON.stringify(e.json, null, 2));
      }
    }
  }



  // gets table data from the blockchain
  // and saves it into the component state: "noteTable"
  getTable() {
    const rpc = new JsonRpc(endpoint);
    rpc.get_table_rows({
      "json": true,
      "code": "notechainacc",   // contract who owns the table
      "scope": "notechainacc",  // scope of the table
      "table": "chatstruct",    // name of the table as specified by the contract abi
      "limit": 100,
    }).then(result => {
      console.log('chats: ', result)
      console.log('chat0: ', result.rows[0])
      this.setState({ chats: result.rows })
    });

    rpc.get_table_rows({
      "json": true,
      "code": "notechainacc",   // contract who owns the table
      "scope": "notechainacc",  // scope of the table
      "table": "notestruct",    // name of the table as specified by the contract abi
      "limit": 100,
    }).then(result => {
      console.log('messages: ', result)
      this.setState({ noteTable: result.rows })
    });
  }

  componentDidMount() {
    this.getTable();
  }

  render() {
    const { noteTable, chats } = this.state;
    const { classes } = this.props;

    // generate each note as a card
    const generateCard = (key, timestamp, user, note, chat_id) => {
      const chat = chats.find((c) => c.prim_key == chat_id);
      if (!chat) return
      return (
        <Card className={classes.card} key={key}>
          <CardContent>
            <Typography variant="headline" component="h2">
              {user}
            </Typography>
            <Typography style={{fontSize:12}} color="textSecondary" gutterBottom>
              {`Chat ID: ${chat_id} - Between ${chat.user_one} and ${chat.user_two}`}
              <br/>
              {`Sent at ${new Date(timestamp*1000).toString()}`}
            </Typography>
            <Typography component="pre">
              {note}
            </Typography>
          </CardContent>
        </Card>
      )
    }
    let noteCards = noteTable.map((row, i) =>
      generateCard(i, row.timestamp, row.user, row.note, row.chatstruct_id));

    return (
      <div>
        <AppBar position="static" color="default">
          <Toolbar>
            <Typography variant="title" color="inherit">
              Note Chain
            </Typography>
          </Toolbar>
        </AppBar>
        {noteCards}
        <Paper className={classes.paper}>
          <h1>Create Chat</h1>
          <form onSubmit={this.handleFormEvent}>
            <TextField
              name="account"
              autoComplete="off"
              label="From Account"
              margin="normal"
              fullWidth
              value='useraaaaaaaa'
            />
            <TextField
              name="privateKey"
              autoComplete="off"
              label="From Private key"
              margin="normal"
              fullWidth
              value='5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5'
            />
            <TextField
              name="accountTwo"
              autoComplete="off"
              label="To Account"
              margin="normal"
              fullWidth
              value='useraaaaaaab'
            />
            {/*<TextField
              name="note"
              autoComplete="off"
              label="Note (Optional)"
              margin="normal"
              multiline
              rows="10"
              fullWidth
            />*/}
            <Button
              variant="contained"
              color="primary"
              className={classes.formButton}
              type="submit">
              Create Chat
            </Button>
          </form>
        </Paper>

        <Paper className={classes.paper}>
          <h1>Send Message</h1>
          <form onSubmit={this.handleSendMessageFormEvent}>
            <TextField
              name="account"
              autoComplete="off"
              label="From Account"
              margin="normal"
              fullWidth
              value='useraaaaaaaa'
            />
            <TextField
              name="privateKey"
              autoComplete="off"
              label="From Private key"
              margin="normal"
              fullWidth
              value='5K7mtrinTFrVTduSxizUc5hjXJEtTjVTsqSHeBHes1Viep86FP5'
            />
            <TextField
              name="chatId"
              autoComplete="off"
              label="Chat ID"
              margin="normal"
              fullWidth
              value={0}
            />
            <TextField
              name="message"
              autoComplete="off"
              label="Message"
              margin="normal"
              multiline
              rows="10"
              fullWidth
            />
            <Button
              variant="contained"
              color="primary"
              className={classes.formButton}
              type="submit">
              Send Message
            </Button>
          </form>
        </Paper>
        <pre className={classes.pre}>
          Below is a list of pre-created accounts information for add/update note:
          <br/><br/>
          accounts = { JSON.stringify(accounts, null, 2) }
        </pre>
      </div>
    );
  }

}

export default withStyles(styles)(Index);
