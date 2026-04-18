import { useState } from "react";
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
} from "antd";
import { LockOutlined } from "@ant-design/icons";
import { Scanner } from "@yudiel/react-qr-scanner";
import SHA256 from "crypto-js/sha256";

import { CONSTANTS } from "../../utils/constants";
import { getFromLocal } from "../../utils/localStorage";
import { updateGoogleSheet } from "../../utils/googleSheetAPI";
import "./StockTake.css";
import "antd/dist/reset.css";

const StockTake = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [numHandSet, setNumHandset] = useState(0);
  const [numMIFI, setNumMIFI] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [itemsAccounted, setItemsAccounted] = useState(
    CONSTANTS.HANDSETS.map((id) => ({
      id,
      mifi: false,
      handset: false,
      remarks: "",
    })),
  );
  const [isSuccessModalShown, setIsSuccessModalShown] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);
  const [stockTakeID, setStockTakeID] = useState("");

  // QR scanner state
  const [isScannerPaused, setIsScannerPaused] = useState(true);

  const initialValues = {
    rankName: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME) || "",
    subUnit: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT) || "",
    platoonSection:
      getFromLocal(CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION) || "",
    itemsAccounted: itemsAccounted,
  };

  const renderStatus = (value) => (
    <Tag color={value ? "green" : "red"}>{value ? "✓" : "✕"}</Tag>
  );

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
    }
    setIsSending(false);
    setIsModalShown(false);
  };

  const checkPassword = (text) => {
    const hash = SHA256(text).toString();

    return hash === CONSTANTS.PASSWORDS.RECEIVER;
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
    console.log(values);
    await sendStockTake(values);
  };

  const onAccountItems = () => {
    form.setFieldsValue({
      itemsAccounted: itemsAccounted,
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
  };

  const handleScanError = (error) => {
    console.error(error);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div>
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
        <Button block color="red" variant="solid" onClick={onAccountItems}>
          Account Items
        </Button>
        <Divider style={{ borderColor: "#000000" }} />
        <Carousel arrows infinite={false}>
          <div>
            <Card title="Handsets and MIFIs:">
              {itemsAccounted.map((item, index) => (
                <div key={item.id}>
                  {index + 1}. {item.id}: HANDSET {renderStatus(item.handset)},
                  MIFI {renderStatus(item.mifi)}
                </div>
              ))}
            </Card>
          </div>
          <div>
            <Card title="Power Banks:">
              {itemsAccounted.map((item, index) => (
                <div key={item.id}>
                  {index + 1}. {item.id}: HANDSET {renderStatus(item.handset)},
                  MIFI {renderStatus(item.mifi)}
                </div>
              ))}
            </Card>
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
              options={[
                { value: CONSTANTS.COYS.HQ, label: CONSTANTS.COYS.HQ },
                { value: CONSTANTS.COYS.ALPHA, label: CONSTANTS.COYS.ALPHA },
                { value: CONSTANTS.COYS.BRAVO, label: CONSTANTS.COYS.BRAVO },
                {
                  value: CONSTANTS.COYS.CHARLIE,
                  label: CONSTANTS.COYS.CHARLIE,
                },
                { value: CONSTANTS.COYS.ME, label: CONSTANTS.COYS.ME },
              ]}
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
            <Input.Password
              suffix={<LockOutlined />}
              placeholder="input password support suffix"
            />
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
                        label={`ID: ${id} | H: ${handset ? "✓" : "✕"} | M: ${mifi ? "✓" : "✕"}`}
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
        onCancel={() => setIsSuccessModalShown(false)}
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
        <Divider style={{ borderColor: "#000000" }} />
      </Modal>
    </div>
  );
};

export default StockTake;
