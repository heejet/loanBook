import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  message,
  Select,
  Checkbox,
  Result,
  Divider,
  Space,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Scanner } from "@yudiel/react-qr-scanner";

import { CONSTANTS } from "../../utils/constants";
import { updateGoogleSheet } from "../../utils/googleSheetAPI";

import "./LoanForm.css";

const LoanForm = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isSending, setIsSending] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);
  const [checkedList, setCheckedList] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [fullSerialOfItemsLoaned, setFullSerialOfItemsLoaned] = useState([]);
  const [isSuccessModalShown, setIsSuccessModalShown] = useState(false);
  const [loanID, setLoanID] = useState("");
  const [otherSubUnit, setOtherSubUnit] = useState("");
  const [subUnit, setSubUnit] = useState(CONSTANTS.COYS);

  // QR scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(true);

  const initialValues = {};

  const onOtherSubUnitChange = (e) => {
    setOtherSubUnit(e.target.value.toUpperCase());
  };

  const addOtherSubUnit = (e) => {
    if (subUnit.length === 0) return;

    e.preventDefault();
    setSubUnit([...subUnit, otherSubUnit]);
    setOtherSubUnit("");
  };

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

  /** Form handlers */
  const onFinish = async (values) => {
    console.log(values);
    const [isHandsetValid, serialsLoaned] = validateHandset(values.itemsLoaned);
    if (!isHandsetValid) {
      messageApi.error(
        "Ensure that you have taken the correct MIFI for each Handset.",
      );
      return;
    }
    setFullSerialOfItemsLoaned(values.itemsLoaned);
    values.itemsLoaned = serialsLoaned;
    setFormValues(values);
    setIsModalShown(true);
  };

  const onChecklistChange = (list) => {
    setCheckedList(list);
  };

  const loanItems = async () => {
    setIsSending(true);
    const [isSuccessful, message] = await updateGoogleSheet(
      formValues,
      CONSTANTS.COMMANDS.SIGN_OUT,
    );
    if (!isSuccessful) {
      messageApi.error(message);
    } else {
      messageApi.success("Items successfully loaned out");
      setLoanID(message);
      setIsSuccessModalShown(true);
      form.resetFields();
    }
    setCheckedList([]);
    setIsSending(false);
    setIsModalShown(false);
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
        name="basic"
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
          {/* <Select
            placeholder="Select your sub-unit."
            options={CONSTANTS.COYS.map((item) => ({
              value: item,
              label: item,
            }))}
          /> */}
          <Select
            placeholder="Select your sub-unit."
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "8px 0" }} />
                <Space style={{ padding: "0 8px 4px" }}>
                  <Input
                    placeholder="Others"
                    value={otherSubUnit}
                    onChange={onOtherSubUnitChange}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={addOtherSubUnit}
                  />
                </Space>
              </>
            )}
            options={subUnit.map((item) => ({
              value: item,
              label: item,
            }))}
          />
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
            <Form.Item label="Items Loaned">
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
          <Button block type="primary" htmlType="submit">
            Loan Items
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
        title="Declaration"
        open={isModalShown}
        onCancel={() => setIsModalShown(false)}
        footer={
          <Button
            type="primary"
            onClick={loanItems}
            loading={isSending}
            disabled={checkedList.length !== CONSTANTS.DECLARATION.LOAN.length}
          >
            Loan Items
          </Button>
        }
      >
        <h5>By submitting this form, I declare that:</h5>
        <Checkbox.Group value={checkedList} onChange={onChecklistChange}>
          {CONSTANTS.DECLARATION.LOAN.map((item) => (
            <Checkbox key={item} value={item} className="checkbox-label">
              {item}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal>

      <Modal
        open={isSuccessModalShown}
        onCancel={() => setIsSuccessModalShown(false)}
        footer={[]}
      >
        <Result
          status="success"
          title={`Successfully Loaned Items. [Loan ID: ${loanID}]`}
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

export default LoanForm;
