import { Flex, Tabs } from "antd";

import LoanForm from "./components/LoanForm/LoanForm";

import "./App.css";

const App = () => {
  return (
    <Flex gap="middle" align="start" vertical>
      <Flex className="App-titleStyle" justify="center" align="center">
        <h1>HANDSET MANAGEMENT</h1>
      </Flex>
      <Flex className="App-FlexBoxStyle" justify="center" align="center">
        <Tabs
          type="card"
          animated
          items={[
            {
              key: "1",
              label: "Loan",
              children: <LoanForm />,
            },
            {
              key: "2",
              label: "Return",
              children: <LoanForm />,
            },
          ]}
        />
      </Flex>
    </Flex>
  );
};

export default App;
