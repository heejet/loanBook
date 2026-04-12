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
  Card,
  Tag,
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
      remakrs: "",
    })),
  );
  const [isSuccessModalShown, setIsSuccessModalShown] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);

  // QR scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(false);

  const initialValues = {
    rankName: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME) || "",
    subUnit: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT) || "",
    platoonSection:
      getFromLocal(CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION) || "",
  };

  const renderStatus = (value) => (
    <Tag color={value ? "green" : "red"}>{value ? "✓" : "✕"}</Tag>
  );

  const returnItems = async (values) => {
    setIsSending(true);
    const [isSuccessful, message] = await updateGoogleSheet(
      values,
      CONSTANTS.COMMANDS.SIGN_IN,
    );
    if (!isSuccessful) {
      messageApi.error(message);
    } else {
      messageApi.success("Items successfully received.");
      setIsSuccessModalShown(true);
      form.resetFields();
    }
    setIsSending(false);
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

    console.log(values);
  };

  const onAccountItems = () => {
    form.setFieldsValue({
      itemsAccounted: itemsAccounted,
    });
    setIsModalShown(true);
  };

  const stopScanner = () => {
    setIsScanning(false);
    setIsScannerPaused(true);
    console.log("Scanner paused");
  };

  const handleScan = (result) => {
    if (!result) return;

    console.log("Detected codes:", result);
    const value = result[0].rawValue;

    const [type, id] = value.split("_");
    setItemsAccounted((prev) => {
      const existing = prev.some((item) => String(item.id) === id);

      if (existing) {
        // messageApi.success(`Successfully added ${value}.`);
        setNumHandset((prev) => prev + 1);
        setNumMIFI((prev) => prev + 1);
        const updated = prev.map((item) => {
          if (String(item.id) === id) {
            return {
              ...item,
              [type.toLowerCase()]: true,
            };
          }
          return item;
        });
        return updated;
      }
      // messageApi.error("Unknown item added.");
      return prev;
    });
    console.log(itemsAccounted);
  };

  const handleScanError = (error) => {
    console.error(error);
    stopScanner();
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div>
      {contextHolder}
      <div style={{ width: "80vw", margin: "0 auto" }}>
        <Scanner
          scanDelay={800}
          onScan={handleScan}
          onError={handleScanError}
          paused={isScannerPaused}
        />
        <Divider style={{ borderColor: "#000000" }} />
        <h3>{`${numHandSet}/100 Handsets Accounted.`}</h3>
        <h3>{`${numMIFI}/100 MIFI Accounted.`}</h3>
        <Divider style={{ borderColor: "#000000" }} />
        <Card>
          {itemsAccounted.map((item, index) => (
            <div key={item.id}>
              {index + 1}. {item.id}: HANDSET {renderStatus(item.handset)}, MIFI{" "}
              {renderStatus(item.mifi)}
            </div>
          ))}
        </Card>
        <Button block color="red" variant="solid" onClick={onAccountItems}>
          Account Items
        </Button>
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

                  // hide fully accounted items
                  if (handset && mifi) return null;

                  return (
                    <div key={field.key}>
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
                          { required: true, message: "Please enter remarks" },
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
          title={`Successfully Received Items.`}
          subTitle="Please keep a screenshot of this page."
        >
          {/* {fullSerialOfItemsLoaned?.map((item, index) => (
            <div key={index}>{item}</div>
          ))} */}
        </Result>
      </Modal>
    </div>
  );
};

export default StockTake;
