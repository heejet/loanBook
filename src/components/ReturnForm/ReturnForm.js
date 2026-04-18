import { useState } from "react";
import { Button, Form, Input, Modal, message, Select, Result } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Scanner } from "@yudiel/react-qr-scanner";
import SHA256 from "crypto-js/sha256";

import { CONSTANTS } from "../../utils/constants";
import { updateGoogleSheet } from "../../utils/googleSheetAPI";
import "./ReturnForm.css";
import "antd/dist/reset.css";

const ReturnForm = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isSending, setIsSending] = useState(false);
  const [fullSerialOfItemsLoaned, setFullSerialOfItemsLoaned] = useState([]);
  const [isSuccessModalShown, setIsSuccessModalShown] = useState(false);

  // QR scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(true);

  const initialValues = {};

  const validateHandset = (itemsLoaned) => {
    const set = new Set();
    const serialsLoaned = [];

    for (const item of itemsLoaned) {
      const [prefix, id] = item.split("_");
      if (prefix === "POWERBANK") {
        serialsLoaned.push(id);
        continue;
      }
      if (set.has(id)) {
        set.delete(id);
        serialsLoaned.push(id);
      } else {
        set.add(id);
      }
    }

    return [set.size === 0, serialsLoaned];
  };

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
    console.log(values);
    const isPasswordCorrect = checkPassword(values.password);

    if (!isPasswordCorrect) {
      messageApi.error("Ensure that you entered the correct password.");
      return;
    }

    const [isHandsetValid, serialsLoaned] = validateHandset(values.itemsLoaned);
    if (!isHandsetValid) {
      messageApi.error(
        "Ensure that you have taken the correct MIFI for each Handset.",
      );
      return;
    }
    setFullSerialOfItemsLoaned(values.itemsLoaned);
    values.itemsLoaned = serialsLoaned;
    await returnItems(values);
  };

  const checkIsValidItem = (text) => {
    if (typeof text !== "string") return false;

    const match = text.match(/^(MIFI|HANDSET|POWERBANK)_(\d+)$/);
    if (!match) return false;

    const type = match[1];
    const id = String(match[2]);

    if (type === "HANDSET" || type === "MIFI") {
      return CONSTANTS.HANDSETS.includes(id);
    }

    if (type === "POWERBANK") {
      return CONSTANTS.POWER_BANKS.includes(id);
    }

    return false;
  };

  const startScan = () => {
    setIsScannerPaused(false);
    setIsScanning(true);
  };

  const stopScanner = () => {
    setIsScanning(false);
    setIsScannerPaused(true);
    console.log("Scanner paused");
  };

  const handleScan = (result) => {
    if (!result) return;
    console.log("Detected codes:", result);
    const isValidItem = checkIsValidItem(result[0].rawValue);

    if (isValidItem) {
      const currentItems = new Set(form.getFieldValue("itemsLoaned") || []);
      currentItems.add(result[0].rawValue);

      const sortedItems = Array.from(currentItems).sort((a, b) => {
        const [nameA, idAStr] = a.split("_");
        const [nameB, idBStr] = b.split("_");
        const idA = Number(idAStr);
        const idB = Number(idBStr);
        if (idA !== idB) return idA - idB;
        return nameA.localeCompare(nameB);
      });

      form.setFieldsValue({ itemsLoaned: sortedItems });
      messageApi.success(`Successfully added ${result[0].rawValue}.`);
    } else {
      messageApi.error("Unknown device detected.");
    }
    setIsScannerPaused(true);
    stopScanner();
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
      <Form
        form={form}
        name="return"
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

        <Form.List
          name="itemsLoaned"
          rules={[
            {
              required: true,
              validator: async (_, itemsLoaned) => {
                if (!itemsLoaned || itemsLoaned.length < 1) {
                  return Promise.reject(
                    new Error("Please add at least one item."),
                  );
                }
              },
            },
          ]}
        >
          {(fields, { remove }, { errors }) => (
            <Form.Item label="Items Received">
              {fields.map((field) => {
                const { key, ...fieldProps } = field;
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Form.Item
                      {...fieldProps}
                      rules={[
                        {
                          required: true,
                          message:
                            "Please scan the QR code of the items you are loaning.",
                        },
                      ]}
                      noStyle
                    >
                      <Input
                        style={{ flex: 1 }}
                        value={
                          form.getFieldValue("itemsLoaned")?.[field.name] || ""
                        }
                        disabled
                      />
                    </Form.Item>

                    {fields.length > 0 && (
                      <MinusCircleOutlined
                        onClick={() => remove(field.name)}
                        style={{ marginLeft: 8, fontSize: 20 }}
                      />
                    )}
                  </div>
                );
              })}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={startScan}
                  style={{ width: "100%" }}
                  icon={<PlusOutlined />}
                  disabled={isScanning}
                >
                  Add Item (Scan QR)
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </Form.Item>
          )}
        </Form.List>

        <Form.Item>
          <Button
            block
            color="cyan"
            variant="solid"
            htmlType="submit"
            loading={isSending}
          >
            Receive Items
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="Loan Item"
        open={isScanning}
        onCancel={stopScanner}
        footer={[]}
        destroyOnHidden
      >
        <Scanner
          onScan={handleScan}
          onError={handleScanError}
          paused={isScannerPaused}
        />
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
          {fullSerialOfItemsLoaned?.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </Result>
      </Modal>
    </div>
  );
};

export default ReturnForm;
