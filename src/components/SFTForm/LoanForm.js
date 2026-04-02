import { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Checkbox,
  message,
  Select,
  Spin,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Scanner } from "@yudiel/react-qr-scanner"; // <-- import QR scanner

import { CONSTANTS } from "../../utils/constants";
import {
  getFromLocal,
  saveToLocal,
  checkIfActivityHasStarted,
} from "../../utils/localStorage";
import { updateGoogleSheet } from "../../utils/googleSheetAPI";

import "./LoanForm.css";

const LoanForm = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isActivityStarted, setIsActivityStarted] = useState(
    checkIfActivityHasStarted(),
  );
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [SFTChecklist, setSFTChecklist] = useState([]);
  const [checkedList, setCheckedList] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [subUnitLabel, setSubUnitLabel] = useState("Platoon/ Section:");

  // QR scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(true);

  const initialValues = {
    rankName: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME) || "",
    subUnit: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT) || "",
    platoonSection:
      getFromLocal(CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION) || "",
  };

  useEffect(() => {}, []);

  /** Form handlers */
  const onFinish = async (values) => {
    console.log(values);
    setFormValues(values);
    await updateGoogleSheet(values, CONSTANTS.COMMANDS.SIGN_OUT);
    form.resetFields();
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
    const currentItems = new Set(form.getFieldValue("itemsLoaned") || []);
    currentItems.add(result[0].rawValue);
    form.setFieldsValue({ itemsLoaned: Array.from(currentItems) });
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
    <Spin spinning={isLoadingChecklist}>
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
          <Input placeholder="Enter rank/name" disabled={isActivityStarted} />
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
            disabled={isActivityStarted}
            placeholder="Select your sub-unit."
            options={[
              { value: CONSTANTS.COYS.HQ, label: CONSTANTS.COYS.HQ },
              { value: CONSTANTS.COYS.ALPHA, label: CONSTANTS.COYS.ALPHA },
              { value: CONSTANTS.COYS.BRAVO, label: CONSTANTS.COYS.BRAVO },
              { value: CONSTANTS.COYS.CHARLIE, label: CONSTANTS.COYS.CHARLIE },
              { value: CONSTANTS.COYS.ME, label: CONSTANTS.COYS.ME },
            ]}
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

                    {fields.length > 0 && !isActivityStarted && (
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
                  disabled={isActivityStarted || isScanning}
                >
                  Add Item (Scan QR)
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </Form.Item>
          )}
        </Form.List>

        {!isActivityStarted && (
          <Form.Item>
            <Button block type="primary" htmlType="submit">
              Loan Items
            </Button>
          </Form.Item>
        )}
      </Form>

      {/* QR Scanner Modal */}
      <Modal
        title="Loan Item"
        open={isScanning}
        onCancel={stopScanner}
        footer={[]}
        destroyOnClose
      >
        <Scanner
          onScan={handleScan}
          onError={handleScanError}
          paused={isScannerPaused}
        />
      </Modal>
    </Spin>
  );
};

export default LoanForm;
