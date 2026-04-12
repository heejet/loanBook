import { ConfigProvider, Flex, Tabs, theme } from "antd";

import LoanForm from "./components/LoanForm/LoanForm";

import "./App.css";
import ReturnForm from "./components/ReturnForm/ReturnForm";

const App = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
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
                label: "Receive",
                children: <ReturnForm />,
              },
            ]}
          />
        </Flex>
      </Flex>
    </ConfigProvider>
  );
};

export default App;
