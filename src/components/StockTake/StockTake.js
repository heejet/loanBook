import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  message,
  Select,
  Result,
  Divider,
  Tag,
  Carousel,
  Card,
  Spin,
} from "antd";
import { Scanner } from "@yudiel/react-qr-scanner";
import SHA256 from "crypto-js/sha256";

import { CONSTANTS } from "../../utils/constants";
import { getList, updateGoogleSheet } from "../../utils/googleSheetAPI";
import "./StockTake.css";
import "antd/dist/reset.css";

const StockTake = () => {
  const initialItemsAccounted = CONSTANTS.HANDSETS.map((id) => ({
    id,
    mifi: false,
    handset: false,
    remarks: "",
  }));

  const initialPowerBanks = CONSTANTS.POWER_BANKS.map((id) => ({
    id,
    powerbank: false,
    remarks: "",
  }));

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [numHandSet, setNumHandset] = useState(0);
  const [numMIFI, setNumMIFI] = useState(0);
  const [numPowerBanks, setNumPowerBanks] = useState(0);

  const [isSending, setIsSending] = useState(false);
  const [itemsAccounted, setItemsAccounted] = useState(initialItemsAccounted);
  const [powerBanksAccounted, setPowerBanksAccounted] =
    useState(initialPowerBanks);
  const [isSuccessModalShown, setIsSuccessModalShown] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);
  const [stockTakeID, setStockTakeID] = useState("");
  const [isListLoading, setIsListLoading] = useState(false);

  // QR scanner state
  const [isScannerPaused, setIsScannerPaused] = useState(true);

  const initialValues = {
    itemsAccounted: itemsAccounted,
    powerBanksAccounted: powerBanksAccounted,
  };

  useEffect(() => {
    const fetchList = async () => {
      setIsListLoading(true);
      try {
        const [handset, powerbank] = await getList(CONSTANTS.SHEETS);
        setItemsAccounted(handset);
        setPowerBanksAccounted(powerbank);
      } catch (error) {
        messageApi.error("Failed to load list.");
      } finally {
        setIsListLoading(false);
      }
    };

    fetchList();
  }, [messageApi]);

  const renderStatus = (value) => (
    <Tag color={value ? "green" : "red"}>{value ? "✓" : "✕"}</Tag>
  );

  const handSetAndMIFIList = useMemo(() => {
    return itemsAccounted.map((item, index) => (
      <div key={item.id}>
        {index + 1}. {item.id}: HANDSET {renderStatus(item.handset)}, MIFI{" "}
        {renderStatus(item.mifi)}
      </div>
    ));
  }, [itemsAccounted]);

  const powerBankList = useMemo(() => {
    return powerBanksAccounted.map((item, index) => (
      <div key={item.id}>
        {index + 1}. {item.id}: POWER BANK {renderStatus(item.powerbank)}
      </div>
    ));
  }, [powerBanksAccounted]);

  const sendStockTake = async (values) => {
    setIsSending(true);
    const [isSuccessful, message] = await updateGoogleSheet(
      values,
      CONSTANTS.COMMANDS.STOCK_TAKE,
    );
    if (!isSuccessful) {
      messageApi.error(message);
    } else {
      messageApi.success("Stock Take successfully logged.");
      setStockTakeID(message);
      setIsSuccessModalShown(true);

      form.resetFields();
      setItemsAccounted(initialItemsAccounted);
      setPowerBanksAccounted(initialItemsAccounted);
    }
    setIsSending(false);
    setIsModalShown(false);
  };

  const checkPassword = (text) => {
    const hash = SHA256(text).toString();

    return hash === CONSTANTS.PASSWORDS.ACCOUNTER;
  };

  /** Form handlers */
  const onFinish = async (values) => {
    const isPasswordCorrect = checkPassword(values.password);

    if (!isPasswordCorrect) {
      messageApi.error("Ensure that you entered the correct password.");
      return;
    }
    setIsScannerPaused(true);
    setItemsAccounted(values.itemsAccounted);
    setPowerBanksAccounted(values.powerBanksAccounted);
    console.log(values);
    await sendStockTake(values);
  };

  const onAccountItems = () => {
    form.setFieldsValue({
      itemsAccounted: itemsAccounted,
      powerBanksAccounted: powerBanksAccounted,
    });
    setIsModalShown(true);
  };

  const handleScan = (result) => {
    if (!result) return;

    const value = result[0].rawValue;
    const [type, id] = value.split("_");
    const key = type?.toLowerCase();

    setItemsAccounted((prev) => {
      let isDuplicate = false;
      let found = false;

      const updated = prev.map((item) => {
        if (String(item.id) === id) {
          found = true;
          if (item[key]) {
            isDuplicate = true;
            return item;
          }

          if (type === "HANDSET") {
            setNumHandset((p) => p + 1);
          } else if (type === "MIFI") {
            setNumMIFI((p) => p + 1);
          }

          return {
            ...item,
            [key]: true,
          };
        }
        console.log(itemsAccounted);
        return item;
      });

      if (!found) {
        return prev;
      }

      if (isDuplicate) {
        return prev;
      }
      return updated;
    });

    setPowerBanksAccounted((prev) => {
      let isDuplicate = false;
      let found = false;

      const updated = prev.map((item) => {
        if (String(item.id) === id) {
          found = true;
          if (item[key]) {
            isDuplicate = true;
            return item;
          }

          if (type === "POWERBANK") {
            setNumPowerBanks((p) => p + 1);
          }

          return {
            ...item,
            [key]: true,
          };
        }
        console.log(powerBanksAccounted);
        return item;
      });

      if (!found) {
        return prev;
      }

      if (isDuplicate) {
        return prev;
      }
      return updated;
    });
  };

  const handleScanError = (error) => {
    console.error(error);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Spin spinning={isListLoading}>
      {contextHolder}
      <div style={{ width: "80vw", margin: "0 auto" }}>
        <Button
          block
          type={isScannerPaused ? "primary" : ""}
          variant="solid"
          onClick={() => setIsScannerPaused((p) => !p)}
        >
          {isScannerPaused ? "Start Scanner" : "Stop Scanner"}
        </Button>
        <Divider style={{ borderColor: "#000000" }} />
        <Scanner
          scanDelay={800}
          onScan={handleScan}
          onError={handleScanError}
          paused={isScannerPaused}
        />
        <Divider style={{ borderColor: "#000000" }} />
        <h3>{`${numHandSet}/100 Handsets Accounted.`}</h3>
        <h3>{`${numMIFI}/100 MIFI Accounted.`}</h3>
        <h3>{`${numPowerBanks}/100 Power Banks Accounted.`}</h3>
        <Button block color="red" variant="solid" onClick={onAccountItems}>
          Account Items
        </Button>
        <Divider style={{ borderColor: "#000000" }} />
        <Carousel arrows infinite={false}>
          <div>
            <Card title="Handsets and MIFIs:">{handSetAndMIFIList}</Card>
          </div>
          <div>
            <Card title="Power Banks:">{powerBankList}</Card>
          </div>
        </Carousel>
      </div>
      <Modal
        open={isModalShown}
        onCancel={() => setIsModalShown(false)}
        footer={[]}
      >
        <Form
          form={form}
          name="stockTake"
          initialValues={initialValues}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Rank/ Name"
            name="rankName"
            rules={[
              {
                required: true,
                message: "Please enter your full rank and name.",
              },
            ]}
          >
            <Input
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                form.setFieldsValue({ rankName: value });
              }}
              placeholder="Enter rank/name"
            />
          </Form.Item>

          <Form.Item
            label="Sub-Unit"
            name="subUnit"
            rules={[
              {
                required: true,
                message: "Please enter your sub unit.",
              },
            ]}
          >
            <Select
              placeholder="Select your sub-unit."
              options={CONSTANTS.COYS.map((item) => ({
                value: item,
                label: item,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please enter your password.",
              },
            ]}
          >
            <Input.Password placeholder="input password support suffix" />
          </Form.Item>
          <Form.List name="itemsAccounted">
            {(fields) => (
              <>
                {fields.map((field) => {
                  const item = form.getFieldValue([
                    "itemsAccounted",
                    field.name,
                  ]);

                  if (!item) return null;

                  const { id, handset, mifi } = item;
                  const isCompleted = handset && mifi;

                  return (
                    <div
                      key={field.key}
                      style={{ display: isCompleted ? "none" : "block" }}
                    >
                      <Form.Item name={[field.name, "id"]} hidden>
                        <Input />
                      </Form.Item>

                      <Form.Item name={[field.name, "handset"]} hidden>
                        <Input />
                      </Form.Item>

                      <Form.Item name={[field.name, "mifi"]} hidden>
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label={`ID: ${id} | HANDSET: ${handset ? "✓" : "✕"} | MIFI: ${mifi ? "✓" : "✕"}`}
                        name={[field.name, "remarks"]}
                        rules={[
                          {
                            required: !isCompleted,
                            message: "Please enter remarks",
                          },
                        ]}
                      >
                        <Input placeholder="Input Remarks" />
                      </Form.Item>
                    </div>
                  );
                })}
              </>
            )}
          </Form.List>
          <Form.List name="powerBanksAccounted">
            {(fields) => (
              <>
                {fields.map((field) => {
                  const item = form.getFieldValue([
                    "powerBanksAccounted",
                    field.name,
                  ]);

                  if (!item) return null;

                  const { id, powerbank } = item;
                  const isCompleted = powerbank;

                  return (
                    <div
                      key={field.key}
                      style={{ display: isCompleted ? "none" : "block" }}
                    >
                      <Form.Item name={[field.name, "id"]} hidden>
                        <Input />
                      </Form.Item>

                      <Form.Item name={[field.name, "powerbank"]} hidden>
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label={`ID: ${id} | POWER BANK: ${powerbank ? "✓" : "✕"}`}
                        name={[field.name, "remarks"]}
                        rules={[
                          {
                            required: !isCompleted,
                            message: "Please enter remarks",
                          },
                        ]}
                      >
                        <Input placeholder="Input Remarks" />
                      </Form.Item>
                    </div>
                  );
                })}
              </>
            )}
          </Form.List>
          <Form.Item>
            <Button
              block
              color="red"
              variant="solid"
              htmlType="submit"
              loading={isSending}
            >
              Account Items
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={isSuccessModalShown}
        onCancel={() => {
          setNumHandset(0);
          setNumMIFI(0);
          setNumPowerBanks(0);
          setIsSuccessModalShown(false);
          window.location.reload();
        }}
        footer={[]}
      >
        <Result
          status="success"
          title={`Stocktake done successfully. [Stock Take ID: ${stockTakeID}]`}
          subTitle="Please keep a screenshot of this page."
        />
        <Divider style={{ borderColor: "#000000" }} />
        <h3>{`${numHandSet}/100 Handsets Accounted.`}</h3>
        <h3>{`${numMIFI}/100 MIFI Accounted.`}</h3>
        <h3>{`${numPowerBanks}/100 Power Banks Accounted.`}</h3>

        <Divider style={{ borderColor: "#000000" }} />
      </Modal>
    </Spin>
  );
};

export default StockTake;
