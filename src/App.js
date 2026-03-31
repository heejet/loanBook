import { Flex } from "antd";

import SFTForm from "./components/SFTForm/SFTForm";

import "./App.css";

const App = () => {
  return (
    <Flex gap="middle" align="start" vertical>
      <Flex className="App-titleStyle" justify="center" align="center">
        <h1>30SCE SFT TRACKER</h1>
      </Flex>
      <Flex className="App-FlexBoxStyle" justify="center" align="center">
        <SFTForm />
      </Flex>
    </Flex>
  );
};

export default App;
