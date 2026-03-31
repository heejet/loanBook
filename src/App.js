import { Flex } from "antd";

import LoanForm from "./components/SFTForm/LoanForm";

import "./App.css";

const App = () => {
  return (
    <Flex gap="middle" align="start" vertical>
      <Flex className="App-titleStyle" justify="center" align="center">
        <h1>LOAN FORM</h1>
      </Flex>
      <Flex className="App-FlexBoxStyle" justify="center" align="center">
        <LoanForm />
      </Flex>
    </Flex>
  );
};

export default App;
