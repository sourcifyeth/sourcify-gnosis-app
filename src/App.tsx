// @ts-ignore
import React, { FC, useState, ChangeEvent } from 'react';
import { CONTRACT_ADDRESS, fetchFiles } from './fileService';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Card,
  Container,
  makeStyles,
  CircularProgress
} from '@material-ui/core';
import Web3 from 'web3';

interface DevDoc {
  methods: object;
}

interface MetadataContentOutput {
  abi: object[];
  devdoc: DevDoc;
  userdoc: object;
}

interface MetadataContent {
  compiler: object;
  language: string;
  output: MetadataContentOutput;
  settings: object;
  sources: object;
  version: number;
}

interface Method {
  documentation: {
    params: Array<any>;
    details: string;
  };
  inputs: Array<{
    internalType: string;
    name: string;
    type: string;
  }>;
  name: string;
  outputs: Array<any>;
  stateMutability: string;
}

const useStyles = makeStyles({
  card: {
    padding: '1rem'
  },
  contractAddressWrapper: {
    display: 'flex',
    alignItems: 'center',
    margin: '1rem 0 2rem 0'
  },
  loader: {
    marginLeft: '1rem'
  },
  descriptionWrapper: {
    marginTop: '1rem'
  },
  methodsWrapper: {
    marginTop: '1rem'
  },
  methodParamWrapper: {
    marginBottom: '1rem'
  },
  transactionBtn: {
    marginTop: '1rem'
  }
});

const App: FC = () => {
  const [methods, setMethods] = useState<null | Array<any>>(null);
  const [abi, setAbi] = useState<null | Array<any>>(null)
  const [selectedMethod, setSelectedMethod] = useState<null | Method>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const classes = useStyles();

  const handleFetchFiles = async () => {
    // get metadata.json and .sol
    setLoading(true);
    const response = await fetchFiles();
    console.log(response);

    const metadataFileContent: MetadataContent = JSON.parse(response.data[0].content);

    const metadataFileContentOutput: MetadataContentOutput = metadataFileContent.output;

    const abi = metadataFileContentOutput.abi;
    setAbi(abi);

    const devDoc = metadataFileContentOutput.devdoc;

    const met: any[] = [];

    for (const [key, value] of Object.entries(devDoc.methods)) {
      abi.forEach((a) => {
        // @ts-ignore
        if (a.name === key.split('(')[0]) {
          met.push({ documentation: { ...value }, ...a });
        }
      });
    }

    setMethods(met);
    setSelectedMethod(met[0]);

    setLoading(false);
  };

  const handleChange = (event: any) => {
    setSelectedMethod(event.target.value);
  };

  const handleAddressInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    console.log(value);

    setAddress(value);

    if (Web3.utils.isAddress(value)) {
      console.log('TRUE - LOAD CONTRACT');
      await handleFetchFiles();
    }
  };

  const sendTransaction = () => {
    const web3 = new Web3(Web3.givenProvider);

    // @ts-ignore
    const contract = new web3.eth.Contract(abi, address);
    console.log(contract);
  }

  return (
    <Container maxWidth="sm" className="App">
      <Card className={classes.card}>
        {/* INTRO */}
        <Typography variant="h5" color="primary" gutterBottom>
          Transaction Constructor
        </Typography>
        <Typography variant="body2" gutterBottom>
          Use this app to construct custom transaction. Enter a Ethereum contract address to get
          started.
        </Typography>

        {/* ADDRESS INPUT */}
        <div className={classes.contractAddressWrapper}>
          <TextField
            fullWidth
            id="standard-read-only-input"
            variant="outlined"
            label="Contract Address"
            onChange={handleAddressInput}
            value={address}
          />
          {loading && <CircularProgress className={classes.loader} size={30} />}
        </div>

        {/* FORM */}
        {methods && selectedMethod && (
          <>
            <Typography variant="h6" gutterBottom>
              Transaction Information
            </Typography>
            <FormControl variant="outlined" fullWidth>
              <InputLabel id="demo-simple-select-outlined-label">Methods</InputLabel>
              <Select
                fullWidth
                labelId="demo-simple-select-outlined-label"
                id="demo-simple-select-outlined"
                value={selectedMethod}
                label="Methods"
                onChange={handleChange}>
                {methods.map((m: any) => (
                  <MenuItem value={m}>{m.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* DESCRIPTION */}
            {selectedMethod.documentation.details && (
              <div className={classes.descriptionWrapper}>
                <Typography variant="subtitle2" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {selectedMethod.documentation.details}
                </Typography>
              </div>
            )}

            {/* INPUTS */}
            {selectedMethod.inputs.length > 0 && (
              <div className={classes.methodsWrapper}>
                <Typography variant="subtitle2" gutterBottom>
                  Inputs
                </Typography>
                {selectedMethod.inputs.map((input: any) => (
                  <div className={classes.methodParamWrapper}>
                    <TextField
                      fullWidth
                      id="yes"
                      variant="outlined"
                      label={`${input.name} (${input.type})`}
                    />
                    <Typography variant="caption" gutterBottom>
                      {selectedMethod.documentation.params[input.name]}
                    </Typography>
                  </div>
                ))}
              </div>
            )}

            {/*  SEND TRANSACTION */}
            <Button
              className={classes.transactionBtn}
              variant="contained"
              color="primary"
              fullWidth
              onClick={sendTransaction}>
              SEND TRANSACTION
            </Button>
          </>
        )}
      </Card>
    </Container>
  );
};

export default App;
