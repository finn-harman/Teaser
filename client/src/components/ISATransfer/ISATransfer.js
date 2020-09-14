import React, { Component } from "react";
import ISAFactoryContract from "../../contracts/ISAFactory.json";
import { makeStyles } from "@material-ui/core/styles";

// import { Container,Grid, Button, Form} from 'semantic-ui-react';
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import CustomInput from "components/CustomInput/CustomInput.js";
import Button from "components/CustomButtons/Button.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardBody from "components/Card/CardBody.js";
import CardFooter from "components/Card/CardFooter.js";

import { APIClient, Openlaw } from 'openlaw';
import Web3 from "web3";

// import "./App.css";

     //PLEASE SUPPLY YOUR OWN LOGIN CREDENTIALS and TEMPLATE NAME FOR OPENLAW
    const URL = "https://lib.openlaw.io/api/v1/default";  //url for your openlaw instance eg. "http://lib.openlaw.io"
    const TEMPLATE_NAME = "Income Sharing Agreement Transfer - TISA"; //name of template stored on Openlaw
    const OPENLAW_USER = //add your Openlaw login email
    const OPENLAW_PASSWORD = //add your Openlaw password
    //create config
    const openLawConfig = {
      server:URL,
      templateName:TEMPLATE_NAME,
      userName:OPENLAW_USER,
      password:OPENLAW_PASSWORD
    }

    //create an instance of the API client with url as parameter
    const apiClient = new APIClient(URL);

class ISATransfer extends Component {
  constructor(props) {
    super(props)
    this.state = {isa: props.isa, request: props.request}
  }
//initial state of variables for BillOfSale Template, and web3,etc
  state = {
      initialLenderName: '',
      borrowerName: '',
      sellerName: '',
      sellerEmail: '',
      buyerName:'',
      buyerEmail:'',
      tokenSupply:'',
      percentage:'',
      purchasePrice:'',
      tokensToTransfer:'',
      web3: null,
      accounts: null,
      contract: null,
      myTemplate: null,
      myContent: null,
      creatorId:'',
      myCompiledTemplate: null,
      draftId:'',
      isa: null,
      request: null
  };

  componentDidMount = async () => {
    try {
      //Get network provider and web3 instance.
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      console.log(accounts[0]);
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      //use BillofSale to create an instance of smart contract
      const deployedNetwork = ISAFactoryContract.networks[networkId];
      const instance = new web3.eth.Contract(
        ISAFactoryContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);

      //Login to your instance with your email and password, return JSON
      apiClient.login(openLawConfig.userName,openLawConfig.password).then(console.log);

      //Retrieve your OpenLaw template by name, use async/await
      const myTemplate = await apiClient.getTemplate(openLawConfig.templateName);

     //pull properties off of JSON and make into variables
      const myTitle = myTemplate.title;
      //set title state
      this.setState({myTitle});

      //Retreive the OpenLaw Template, including MarkDown
      const myContent = myTemplate.content;
      this.setState({myTemplate});
      console.log('myTemplate..',myTemplate);

       const contractId =  myTemplate.id;
      console.log("contract id..",contractId);

      //TEST this function ?
      //   apiClient.getAccessToken(contractId)
      // .then(({ data }) => console.log(data));

      //Get the most recent version of the OpenLaw API Tutorial Template
      const versions = await apiClient.getTemplateVersions(openLawConfig.templateName, 20, 1);
      console.log("versions..",versions[0], versions.length);

      //Get the creatorID from the template.
      const creatorId = versions[0].creatorId;
      console.log("creatorId..",creatorId);
      this.setState({creatorId});

      //Get my compiled Template, for use in rendering the HTML in previewTemplate
      const myCompiledTemplate = await Openlaw.compileTemplate(myContent);
      if (myCompiledTemplate.isError) {
        throw "my Template error" + myCompiledTemplate.errorMessage;
      }
       console.log("my compiled template..",myCompiledTemplate);
       this.setState({myCompiledTemplate});

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

/*Preview OpenLaw Template*/
previewTemplate = async (event) => {
    console.log('preview of openlaw draft..');
    event.preventDefault();
      //Display HTML
    try{

      const params = {
          "Seller Address": this.state.seller,
          "Buyer Address": this.state.buyer,
          "Purchased Item": this.state.descr,
          "Purchase Price":this.state.price,
       };

       const executionResult = await Openlaw.execute(this.state.myCompiledTemplate.compiledTemplate, {}, params);
       const agreements = await Openlaw.getAgreements(executionResult.executionResult);
       const html = await Openlaw.renderForReview(agreements[0].agreement,{});
       console.log("this is the html..", html);
       //set html state
       this.setState({html});
   }//try

  catch(error){
      console.log("draft not submitted yet..", error);
  }
};

/*HELPERS*/
  runExample = async () => {
    const { accounts, contract } = this.state;
    console.log("example openlaw starting");
  };
/*converts an email address into an object, to be used with uploadDraft
or upLoadContract methods from the APIClient.
as of " OpenLaw v.0.1.29" this function convertUserObject is no longer  needed. */

  // convertUserObject = (original) => {
  //   const object = {
  //     id: {
  //       id: original.id
  //     },
  //     email: original.email,
  //     identifiers: [
  //       {
  //         identityProviderId: "openlaw",
  //         identifier: original.identifiers[0].id
  //       }
  //     ]
  //   }
  //   return object;
  // }

/*Build Open Law Params to Submit for Upload Contract*/

  buildOpenLawParamsObj = async (myTemplate, creatorId) => {
    /*
       -  getUserDetails() is deprecated as of OpenLaw "0.1.28"
       -  no longer need const sellerUser and const buyerUser
        - no longer need JSON.stringify(this.convertUserObject())
    */
    //const sellerUser = await apiClient.getUserDetails(this.state.sellerEmail);
    //const buyerUser = await apiClient.getUserDetails(this.state.buyerEmail);

    const object = {
      templateId: myTemplate.id,
      title: myTemplate.title,
      text: myTemplate.content,
      creator: this.state.creatorId,
      parameters: {
        "Initial Lender Name": this.state.initialLenderName,
        "Borrower Name": this.state.borrowerName,
        "Token Supply": this.state.tokenSupply,
        "Income Percentage": this.state.percentage,
        "Number of Assigned Shares": this.state.tokensToTransfer,
        "Purchase Price": this.state.purchasePrice,
        "Seller Name": this.state.sellerName,
        "Seller Email": this.state.sellerEmail,
        "Buyer Name": this.state.buyerName,
        "Buyer Email": this.state.buyerEmail
      },
      overriddenParagraphs: {},
      agreements: {},
      readonlyEmails: [],
      editEmails: [],
      draftId: this.state.draftId,
    };
    return object;
  };

  onSubmit = async(event) => {
    console.log('submiting to OL..');
    event.preventDefault();

    var supply = await this.state.isa.methods.totalSupply().call()
    var incomePercentage = await this.state.isa.methods.incomePercentage().call()

    this.setState({tokenSupply: supply})
    this.setState({percentage: incomePercentage})
    this.setState({tokensToTransfer: this.state.request[2]})
    this.setState({purchasePrice: this.state.request[3]})

    try{
      //login to api
      apiClient.login(openLawConfig.userName,openLawConfig.password);
      console.log('apiClient logged in');

      //add Open Law params to be uploaded
      const uploadParams = await this.buildOpenLawParamsObj(this.state.myTemplate,this.state.creatorId);
      console.log('parameters from user..', uploadParams.parameters);
      console.log('contract text..', uploadParams.text)
      console.log('all parameters uploading...', uploadParams);

      // uploadDraft, sends a draft contract to "Draft Management", which can be edited.
      // const draftId = await apiClient.uploadDraft(uploadParams);
      // console.log('draft id..', draftId);
      // this.setState({draftId});

      // uploadContract, this sends a completed contract to "Contract Management", where it can not be edited.
      const result = await apiClient.uploadContract(uploadParams);
      console.log('results..', result)

      await apiClient.sendContract([],[],result)
    }
    catch(error){
      console.log(error);
    }
  }

  render() {
      return (
        <div>
          <GridContainer>
            <GridItem xs={12} sm={12} md={12}>
              <Card>
                <CardHeader color="info">
                  <h4>OpenLaw</h4>
                  <p>Transfer ISA</p>
                </CardHeader>
                <CardBody>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}
                      onChange={(e) => this.setState({initialLenderName: e.target.value})}
                      >
                      <CustomInput
                        labelText="Initial Lender's Full Name"
                        id="initial-lender-name"
                        formControlProps={{
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}
                      onChange={(e) => this.setState({borrowerName: e.target.value})}
                      >
                      <CustomInput
                        labelText="Initial Borrower's Full Name"
                        id="initial-borrower-name"
                        formControlProps={{
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}
                      onChange={(e) => this.setState({sellerName: e.target.value})}
                      >
                      <CustomInput
                        labelText="Seller's Full Name"
                        id="seller-name"
                        formControlProps={{
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}
                      onChange={(e) => this.setState({sellerEmail: e.target.value})}
                      >
                      <CustomInput
                        labelText="Seller Email Address"
                        id="seller-email-address"
                        formControlProps={{
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}
                      onChange={(e) => this.setState({buyerName: e.target.value})}
                      >
                      <CustomInput
                        labelText="Buyer's Full Name"
                        id="buyer-name"
                        formControlProps={{
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={12}
                      onChange={(e) => this.setState({buyerEmail: e.target.value})}
                      >
                      <CustomInput
                        labelText="Buyer Email Address"
                        id="buyer-email-address"
                        formControlProps={{
                          fullWidth: true
                        }}
                      />
                    </GridItem>
                  </GridContainer>
                </CardBody>
                <CardFooter>
                  <Button onClick={this.onSubmit} color="info">Transfer ISA</Button>
                </CardFooter>
              </Card>
            </GridItem>
          </GridContainer>
        </div>
    )
  }
}

export default ISATransfer;
